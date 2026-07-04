export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const quoteId = getRouterParam(event, 'id')!
  const offerId = Number(getRouterParam(event, 'offerId'))

  const quote = getQuote(quoteId)
  const offer = Number.isFinite(offerId) ? getOffer(quoteId, offerId) : null
  if (!quote || !offer) throw createError({ statusCode: 404, statusMessage: 'Offer not found' })

  const pdf = await generateOfferPdf(quote, offer)
  setHeader(event, 'content-type', 'application/pdf')
  setHeader(event, 'content-disposition', `inline; filename="offer-${quoteId}-${offerId}.pdf"`)
  return pdf
})
