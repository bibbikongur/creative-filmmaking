// PATCH /api/admin/quotes/:id/offers/:offerId  { confirmed: boolean }
// Marks an offer as accepted by the customer (or undoes that). Confirming
// flips the quote to "won" and adds the offer's lines to the rental stats.
// The offer does not have to be emailed from here first: a saved offer that
// was exported as a PDF and sent by hand can be confirmed too.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const quoteId = getRouterParam(event, 'id')!
  const offerId = Number(getRouterParam(event, 'offerId'))
  const body = await readBody<{ confirmed?: boolean }>(event)

  if (typeof body?.confirmed !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Expected { confirmed: boolean }' })
  }
  const offer = Number.isFinite(offerId) ? getOffer(quoteId, offerId) : null
  if (!offer) throw createError({ statusCode: 404, statusMessage: 'Offer not found' })
  const updated = body.confirmed ? confirmOffer(quoteId, offerId) : unconfirmOffer(quoteId, offerId)
  return { ok: true, offer: updated, quote: getQuote(quoteId) }
})
