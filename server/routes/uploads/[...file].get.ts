import { createReadStream, promises as fs } from 'node:fs'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
}

// Formats sharp is allowed to decode for resizing (gif/avif pass through
// untouched — gif may be animated, avif is slow to re-encode).
const RESIZABLE = new Set(['.jpg', '.jpeg', '.png', '.webp'])

// Requested widths snap UP to this ladder so the variant cache stays small
// no matter what w= values clients invent.
const WIDTHS = [120, 240, 320, 480, 640, 960, 1280, 1600, 2048]

const OUTPUT = {
  avif: { ext: '.avif', type: 'image/avif' },
  webp: { ext: '.webp', type: 'image/webp' },
  jpeg: { ext: '.jpg', type: 'image/jpeg' },
} as const

/**
 * Serves admin-uploaded photos from the data dir, resizing on demand.
 *
 * /uploads/<name>                    → original file, byte for byte
 * /uploads/<name>?w=640              → 640px-wide webp (default format)
 * /uploads/<name>?w=640&f=jpeg&q=80  → jpeg variant
 *
 * Variants are cached on disk under <uploads>/.cache and served from there
 * on repeat requests. The app/providers/uploads.ts Nuxt Image provider
 * builds these URLs so <NuxtImg> gets a real srcset for uploaded photos.
 * Filenames are random and content never changes for a given name, so
 * everything is cached hard.
 */
export default defineEventHandler(async (event) => {
  // basename() strips any path segments — no traversal out of the uploads dir.
  const name = basename(decodeURIComponent(getRouterParam(event, 'file') || ''))
  const ext = extname(name).toLowerCase()
  const type = MIME[ext]
  if (!name || name.startsWith('.') || !type) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const path = join(uploadsDir(), name)
  const stat = await fs.stat(path).catch(() => null)
  if (!stat?.isFile()) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')

  const query = getQuery(event)
  const rawW = Number.parseInt(String(query.w ?? ''), 10)
  if (!rawW || rawW <= 0 || !RESIZABLE.has(ext)) {
    // Original requested (or a format we don't transcode).
    setHeader(event, 'content-type', type)
    setHeader(event, 'content-length', stat.size)
    return sendStream(event, createReadStream(path))
  }

  const width = WIDTHS.find(w => w >= rawW) ?? WIDTHS[WIDTHS.length - 1]!
  // webp requests are silently upgraded to avif when the browser advertises
  // support — smaller files, better Core Web Vitals; old browsers keep webp.
  // Vary: Accept keeps caches from serving avif to a webp-only client.
  const requested = query.f === 'jpeg' ? 'jpeg' as const : 'webp' as const
  const fmt = requested === 'webp' && (getHeader(event, 'accept') ?? '').includes('image/avif')
    ? 'avif' as const
    : requested
  if (requested === 'webp') setHeader(event, 'vary', 'Accept')
  const rawQ = Number.parseInt(String(query.q ?? ''), 10)
  // avif reaches webp-80 visual quality around q60 at a fraction of the bytes.
  const quality = rawQ >= 20 && rawQ <= 100 ? rawQ : fmt === 'avif' ? 60 : 80
  const out = OUTPUT[fmt]
  setHeader(event, 'content-type', out.type)

  const cacheDir = join(uploadsDir(), '.cache')
  const cachePath = join(cacheDir, `${name}.w${width}.q${quality}${out.ext}`)

  const cached = await fs.stat(cachePath).catch(() => null)
  if (cached?.isFile()) {
    setHeader(event, 'content-length', cached.size)
    return sendStream(event, createReadStream(cachePath))
  }

  // .rotate() bakes in EXIF orientation, which webp/avif output would otherwise lose.
  const image = sharp(path).rotate().resize({ width, withoutEnlargement: true })
  const buf = fmt === 'jpeg'
    ? await image.jpeg({ quality, mozjpeg: true }).toBuffer()
    : fmt === 'avif'
      ? await image.avif({ quality, effort: 4 }).toBuffer()
      : await image.webp({ quality }).toBuffer()

  // Cache best-effort: write to a unique temp name, then rename. A concurrent
  // request may win the rename race — fine, serving the buffer still works.
  try {
    await fs.mkdir(cacheDir, { recursive: true })
    const tmp = `${cachePath}.${process.pid}-${Math.random().toString(36).slice(2)}.tmp`
    await fs.writeFile(tmp, buf)
    await fs.rename(tmp, cachePath).catch(() => fs.unlink(tmp).catch(() => {}))
  }
  catch { /* serving the response matters more than caching it */ }

  setHeader(event, 'content-length', buf.length)
  return buf
})
