export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  if (!deleteCompany(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Company not found' })
  }
  return { ok: true }
})
