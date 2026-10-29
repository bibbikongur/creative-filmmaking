import type { DiscountType, InsuranceTier, OfferCurrency, OfferExtraKind, PricingMode } from '~~/app/types'

const EXTRA_KINDS: OfferExtraKind[] = ['insurance', 'driver', 'km']
const INSURANCE_TIERS: InsuranceTier[] = ['bronze', 'silver', 'gold']

interface OfferBody {
  items?: {
    quoteItemId?: number
    unitPrice?: number
    pricing?: PricingMode
    days?: number
    weeks?: number
    extras?: { kind?: OfferExtraKind, tier?: InsuranceTier, qty?: number, unlimited?: boolean, unitPrice?: number }[]
  }[]
  currency?: OfferCurrency
  discountType?: DiscountType | ''
  discountValue?: number
  note?: string
  validUntil?: string
  /** false = offer without VAT (e.g. foreign customers); defaults to true. */
  vat?: boolean
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
    .map(i => ({
      quoteItemId: Number(i?.quoteItemId),
      unitPrice: Number(i?.unitPrice),
      pricing: (i?.pricing === 'day' || i?.pricing === 'week' ? i.pricing : 'flat') as PricingMode,
      days: i?.pricing === 'day' ? Number(i?.days) : undefined,
      weeks: i?.pricing === 'week' ? Number(i?.weeks) : undefined,
      extras: (Array.isArray(i?.extras) ? i.extras : [])
        .filter(e => EXTRA_KINDS.includes(e?.kind!))
        .map(e => ({
          kind: e.kind!,
          tier: e.kind === 'insurance' ? e.tier : undefined,
          unlimited: e.kind === 'driver' && e.unlimited === true ? true : undefined,
          // Insurance and unlimited drivers are per vehicle; the store fills qty from the line.
          qty: e.kind === 'insurance' || (e.kind === 'driver' && e.unlimited === true) ? undefined : Number(e.qty),
          unitPrice: Number(e.unitPrice),
        })),
    }))
  if (!items.length || items.some(i => !Number.isFinite(i.quoteItemId) || !Number.isFinite(i.unitPrice) || i.unitPrice < 0)) {
    errors.push('Every item needs a price (0 or higher).')
  }
  if (items.some(i => i.pricing === 'day' && (!Number.isFinite(i.days!) || i.days! < 1 || i.days! > 999))) {
    errors.push('Per-day items need a number of days (1 or more).')
  }
  if (items.some(i => i.pricing === 'week' && (!Number.isFinite(i.weeks!) || i.weeks! <= 0 || i.weeks! > 999))) {
    errors.push('Per-week items need a number of weeks greater than 0 (e.g. 1.5).')
  }

  const extras = items.flatMap(i => i.extras)
  if (extras.some(e => !Number.isFinite(e.unitPrice) || e.unitPrice < 0)) {
    errors.push('Every vehicle extra needs a price (0 or higher).')
  }
  if (extras.some(e => e.kind === 'insurance' && !INSURANCE_TIERS.includes(e.tier!))) {
    errors.push('Insurance must be Bronze, Silver or Gold.')
  }
  if (extras.some(e => e.kind === 'driver' && !e.unlimited && (!Number.isInteger(e.qty) || e.qty! < 1 || e.qty! > 99))) {
    errors.push('Additional drivers need a count of 1 or more.')
  }
  if (extras.some(e => e.kind === 'km' && (!Number.isFinite(e.qty!) || e.qty! <= 0 || e.qty! > 1_000_000))) {
    errors.push('KM charges need a number of kilometres greater than 0.')
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
    vatRate: body.vat === false ? 0 : VAT_RATE,
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
