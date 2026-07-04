import type { DiscountType, OfferCurrency } from '~~/app/types'

interface OfferBody {
  items?: { quoteItemId?: number, unitPrice?: number }[]
  currency?: OfferCurrency
  discountType?: DiscountType | ''
  discountValue?: number
  note?: string
  validUntil?: string
  /** false = save only (PDF preview); true = save + email the customer */
  send?: boolean
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const quoteId = getRouterParam(event, 'id')!
  const body = await readBody<OfferBody>(event)

  const errors: string[] = []
  const currency: OfferCurrency = body.currency === 'EUR' ? 'EUR' : 'ISK'
  const discountType: DiscountType | undefined
    = body.discountType === 'percent' || body.discountType === 'fixed' ? body.discountType : undefined
  let discountValue: number | undefined
  if (discountType) {
    discountValue = Number(body.discountValue)
    if (!Number.isFinite(discountValue) || discountValue <= 0) errors.push('Discount value must be a positive number.')
    if (discountType === 'percent' && discountValue! > 100) errors.push('Percent discount cannot exceed 100.')
  }

  const items = (Array.isArray(body.items) ? body.items : [])
    .map(i => ({ quoteItemId: Number(i?.quoteItemId), unitPrice: Number(i?.unitPrice) }))
  if (!items.length || items.some(i => !Number.isFinite(i.quoteItemId) || !Number.isFinite(i.unitPrice) || i.unitPrice < 0)) {
    errors.push('Every item needs a price (0 or higher).')
  }

  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors } })
  }

  const offer = createOffer(quoteId, {
    currency,
    discountType,
    discountValue,
    note: body.note?.trim() || undefined,
    validUntil: body.validUntil?.trim() || undefined,
    items,
  })

  if (!body.send) {
    return { ok: true, offer }
  }

  const quote = getQuote(quoteId)!
  const pdf = await generateOfferPdf(quote, offer)
  try {
    await sendOfferEmail(quote, offer, pdf)
  }
  catch (error: any) {
    // Offer row is kept (sent_at stays null) so the admin can retry from the UI.
    console.error(`[offer] Failed to send offer #${offer.id} for ${quoteId}:`, error)
    throw createError({
      statusCode: error?.statusCode === 503 ? 503 : 502,
      statusMessage: error?.statusMessage || 'The offer was saved but the email failed to send. Check SMTP settings and resend.',
    })
  }

  markOfferSent(offer.id)
  setQuoteStatus(quoteId, 'offered')
  return { ok: true, offer: getOffer(quoteId, offer.id) }
})
