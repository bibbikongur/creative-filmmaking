export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const albumId = getRouterParam(event, 'id')!
  const photoId = getRouterParam(event, 'photoId')!
  if (!deletePhoto(user.id, albumId, photoId)) {
    throw createError({ statusCode: 404, statusMessage: 'Photo not found' })
  }
  return { ok: true }
})
