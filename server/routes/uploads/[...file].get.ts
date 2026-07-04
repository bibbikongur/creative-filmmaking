import { createReadStream, promises as fs } from 'node:fs'
import { basename, extname, join } from 'node:path'

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
}

// Serves admin-uploaded photos from the data dir. Filenames are random and
// content never changes for a given name, so cache hard.
export default defineEventHandler(async (event) => {
  // basename() strips any path segments — no traversal out of the uploads dir.
  const name = basename(decodeURIComponent(getRouterParam(event, 'file') || ''))
  const type = MIME[extname(name).toLowerCase()]
  if (!name || name.startsWith('.') || !type) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const path = join(uploadsDir(), name)
  const stat = await fs.stat(path).catch(() => null)
  if (!stat?.isFile()) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  setHeader(event, 'content-type', type)
  setHeader(event, 'content-length', stat.size)
  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
  return sendStream(event, createReadStream(path))
})
