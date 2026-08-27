export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event).catch(() => ({}))

  const patch: {
    name?: string
    note?: string | null
    coverPhotoId?: string
    coords?: { lat: number, lng: number } | null
    color?: string | null
    chosen?: boolean
    rating?: number
  } = {}
  if (body?.name !== undefined) patch.name = validateAlbumName(body.name)
  if (body?.note !== undefined) patch.note = validateNote(body.note)
  if (typeof body?.coverPhotoId === 'string') patch.coverPhotoId = body.coverPhotoId
  // coords: an object sets the pin, null clears it, absent leaves it unchanged.
  if (body?.coords !== undefined) {
    patch.coords = body.coords === null ? null : validateCoords(body.coords?.lat, body.coords?.lng)
  }
  if (body?.color !== undefined) patch.color = validateColor(body.color)
  if (body?.chosen !== undefined) patch.chosen = !!body.chosen
  if (body?.rating !== undefined) patch.rating = validateRating(body.rating)

  const album = updateAlbum(user.id, id, patch)
  if (!album) throw createError({ statusCode: 404, statusMessage: 'Folder not found' })
  return album
})
