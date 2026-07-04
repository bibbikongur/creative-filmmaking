export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  if (!deleteQuote(getRouterParam(event, 'id')!)) {
    throw createError({ statusCode: 404, statusMessage: 'Quote not found' })
  }
  return { ok: true }
})
