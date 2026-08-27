export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const doc = getLocationMap(user.id, getRouterParam(event, 'id')!)
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Map not found' })
  return doc
})
