import { randomBytes } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
// 100 megapixels: far above any camera original, far below a decompression bomb.
const MAX_PIXELS = 100_000_000

// What the file really is (sharp reads the bytes), mapped to the extension it
// is stored under. The client's filename and declared type are not trusted.
const EXT_BY_FORMAT: Record<string, string> = {
  jpeg: '.jpg',
  png: '.png',
  webp: '.webp',
  gif: '.gif',
  heif: '.avif', // sharp reports AVIF as heif + compression "av1"
}

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

  const badImage = () => createError({ statusCode: 400, statusMessage: 'Only JPG, PNG, WebP, AVIF or GIF images are allowed.' })
  const meta = await sharp(file.data, { limitInputPixels: MAX_PIXELS }).metadata().catch(() => null)
  const ext = meta?.format ? EXT_BY_FORMAT[meta.format] : undefined
  if (!meta || !ext || (meta.format === 'heif' && meta.compression !== 'av1')) throw badImage()

  // Phone photos carry EXIF: GPS position, device, timestamps. The original is
  // publicly downloadable, so JPEG/PNG/WebP are re-encoded with the metadata
  // dropped (orientation baked in, colour profile kept). GIF (may be animated)
  // and AVIF are stored as sent.
  let data: Buffer = file.data
  if (meta.format === 'jpeg' || meta.format === 'png' || meta.format === 'webp') {
    const image = sharp(file.data, { limitInputPixels: MAX_PIXELS }).rotate().keepIccProfile()
    data = await (meta.format === 'jpeg'
      ? image.jpeg({ quality: 92, mozjpeg: true })
      : meta.format === 'png'
        ? image.png()
        : image.webp({ quality: 92 })
    ).toBuffer().catch(() => { throw badImage() })
  }

  const name = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}${ext}`
  await fs.mkdir(uploadsDir(), { recursive: true })
  await fs.writeFile(join(uploadsDir(), name), data)

  return { url: `/uploads/${name}` }
})
