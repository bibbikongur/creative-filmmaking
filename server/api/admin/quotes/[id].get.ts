export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const quote = getQuote(getRouterParam(event, 'id')!)
  if (!quote) throw createError({ statusCode: 404, statusMessage: 'Quote not found' })
  return quote
})
