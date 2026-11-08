export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  if (!deleteContract(Number(getRouterParam(event, 'id')))) {
    throw createError({ statusCode: 404, statusMessage: 'Contract not found' })
  }
  return { ok: true }
})
