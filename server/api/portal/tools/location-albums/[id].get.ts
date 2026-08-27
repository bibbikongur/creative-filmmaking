export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const album = getAlbum(user.id, getRouterParam(event, 'id')!)
  if (!album) throw createError({ statusCode: 404, statusMessage: 'Album not found' })
  return album
})
