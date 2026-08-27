export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const albumId = getRouterParam(event, 'id')!
  const photoId = getRouterParam(event, 'photoId')!
  const body = await readBody(event).catch(() => ({}))

  const photo = updatePhoto(user.id, albumId, photoId, { caption: validateCaption(body?.caption) })
  if (!photo) throw createError({ statusCode: 404, statusMessage: 'Photo not found' })
  return photo
})
