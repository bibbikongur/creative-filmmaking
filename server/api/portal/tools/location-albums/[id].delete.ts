export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  if (!deleteAlbum(user.id, getRouterParam(event, 'id')!)) {
    throw createError({ statusCode: 404, statusMessage: 'Album not found' })
  }
  return { ok: true }
})
