import { randomBytes } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { extname, join } from 'node:path'

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

// Photo upload from the admin panel. Files land in <dataDir>/uploads and are
// served back at /uploads/<name> (see server/routes/uploads/[...file].get.ts).
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'file' && p.filename)
  if (!file?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No file received.' })
  }
  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Image is too large (max 10 MB).' })
  }

  const ext = extname(file.filename!).toLowerCase()
  if (!ALLOWED_EXT.includes(ext) || !file.type?.startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'Only JPG, PNG, WebP, AVIF or GIF images are allowed.' })
  }

  const name = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}${ext}`
  await fs.mkdir(uploadsDir(), { recursive: true })
  await fs.writeFile(join(uploadsDir(), name), file.data)

  return { url: `/uploads/${name}` }
})
