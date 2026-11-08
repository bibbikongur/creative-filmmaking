// POST /api/admin/contracts { quoteId, offerId? }
// Creates a rental agreement prefilled from the quote and one of its offers
// (default: the confirmed offer, else the latest). Without a quote an empty
// agreement is created for filling in by hand.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ quoteId?: string, offerId?: number }>(event).catch(() => ({} as { quoteId?: string, offerId?: number }))

  if (!body?.quoteId) {
    return createContract(null, null, emptyContractData())
  }
  const quote = getQuote(body.quoteId)
  if (!quote) throw createError({ statusCode: 404, statusMessage: 'Quote not found' })

  const offer = body.offerId != null
    ? quote.offers.find(o => o.id === Number(body.offerId)) ?? null
    : quote.offers.find(o => o.confirmedAt) ?? quote.offers.at(-1) ?? null
  if (body.offerId != null && !offer) throw createError({ statusCode: 404, statusMessage: 'Offer not found' })

  const fleet = await getVehicles()
  return createContract(quote.id, offer?.id ?? null, buildContractData(quote, offer, fleet))
})
