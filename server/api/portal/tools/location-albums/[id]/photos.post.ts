import { MAX_PHOTO_BYTES, MAX_THUMB_BYTES } from '~~/server/utils/locationAlbumStore'

// Upload one photo to an album (multipart): the downscaled "full" image and its
// "thumb", both generated in the browser, plus the originalName and pixel
// dimensions. One photo per request keeps matching simple and gives the client
// per-photo progress.
export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const albumId = getRouterParam(event, 'id')!
  if (!albumBelongsToUser(user.id, albumId)) {
    throw createError({ statusCode: 404, statusMessage: 'Album not found' })
  }

  const parts = (await readMultipartFormData(event)) ?? []
  const text = (name: string) => parts.find(p => p.name === name && !p.filename)?.data.toString('utf8')
  const full = parts.find(p => p.name === 'full' && p.filename)
  const thumb = parts.find(p => p.name === 'thumb' && p.filename)
  if (!full?.data?.length || !thumb?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'A full image and a thumbnail are required.' })
  }
  if (full.data.length > MAX_PHOTO_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Image is too large.' })
  }
  if (thumb.data.length > MAX_THUMB_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Thumbnail is too large.' })
  }

  const photo = addPhoto(user.id, albumId, {
    full: full.data,
    thumb: thumb.data,
    originalName: text('originalName') || full.filename || 'photo',
    width: Number(text('width')) || 0,
    height: Number(text('height')) || 0,
  })
  if (!photo) throw createError({ statusCode: 404, statusMessage: 'Album not found' })
  return photo
})
