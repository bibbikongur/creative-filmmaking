// GET /api/admin/contracts            → every rental agreement, newest first
// GET /api/admin/contracts?quoteId=…  → the agreements made from one quote
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const q = getQuery(event)
  const quoteId = typeof q.quoteId === 'string' && q.quoteId ? q.quoteId : undefined
  return listContracts(quoteId)
})
