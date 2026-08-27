import { promises as fs } from 'node:fs'

// Stream a photo file. Auth-gated and owner-scoped: files are private
// (deliberately not under the public /uploads route). ?size=thumb serves the
// grid thumbnail; anything else serves the full image.
export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const albumId = getRouterParam(event, 'id')!
  const photoId = getRouterParam(event, 'photoId')!
  const size = getQuery(event).size === 'thumb' ? 'thumb' : 'full'

  const file = photoFileForStream(user.id, albumId, photoId, size)
  if (!file) throw createError({ statusCode: 404, statusMessage: 'Photo not found' })

  const data = await fs.readFile(file.path).catch(() => null)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Photo file is missing.' })

  setResponseHeaders(event, {
    'content-type': file.mime,
    // Files are immutable per photo id, so let the browser cache aggressively.
    'cache-control': 'private, max-age=31536000, immutable',
  })
  return data
})
