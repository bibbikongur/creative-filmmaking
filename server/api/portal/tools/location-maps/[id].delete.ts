export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  if (!deleteLocationMap(user.id, getRouterParam(event, 'id')!)) {
    throw createError({ statusCode: 404, statusMessage: 'Map not found' })
  }
  return { ok: true }
})
