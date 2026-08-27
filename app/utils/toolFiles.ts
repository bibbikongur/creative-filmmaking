// Shared client-side helpers for the portal "Hjálpartól" (helper tools).
// Everything here runs in the browser — no file ever leaves the device.

/** Trigger a browser download for a Blob or byte array. */
export function downloadBlob(data: Blob | Uint8Array | ArrayBuffer, filename: string, type?: string): void {
  const blob = data instanceof Blob
    ? data
    : new Blob([data as BlobPart], { type: type || 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Human-readable file size, e.g. 1536 -> "1.5 KB". */
export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const n = bytes / 1024 ** i
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * Load a browser <script> once and resolve when it's ready. Used for vendored
 * libraries that ship a UMD bundle the app bundler can't process (e.g. heic2any).
 * Repeated calls for the same src reuse the in-flight / resolved promise.
 */
const scriptPromises = new Map<string, Promise<void>>()
export function loadScript(src: string): Promise<void> {
  const existing = scriptPromises.get(src)
  if (existing) return existing
  const p = new Promise<void>((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => {
      scriptPromises.delete(src) // allow a later retry
      reject(new Error(`Failed to load script: ${src}`))
    }
    document.head.appendChild(el)
  })
  scriptPromises.set(src, p)
  return p
}

/** Strip the extension from a filename ("photo.HEIC" -> "photo"). */
export function baseName(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(0, dot) : filename
}

/**
 * Downscale a browser-renderable image to fit within `maxDim` on its longest
 * side and re-encode it (JPEG by default) via canvas. EXIF orientation is
 * baked in (imageOrientation: 'from-image'). Used by the location-photo tool to
 * shrink uploads client-side — one "full" version for the lightbox and a small
 * thumbnail for the grid — so the files that reach the server are already sane.
 * HEIC is NOT decodable this way in most browsers — convert it first.
 */
export async function downscaleImage(
  file: File | Blob,
  maxDim: number,
  type: 'image/jpeg' | 'image/webp' | 'image/png' = 'image/jpeg',
  quality = 0.85,
): Promise<{ blob: Blob, width: number, height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality))
    if (!blob) throw new Error('Canvas toBlob failed')
    return { blob, width, height }
  }
  finally {
    bitmap.close()
  }
}

/**
 * Decode any browser-renderable image (JPG/PNG/WebP/GIF) to PNG bytes via canvas.
 * Used so pdf-lib can embed formats it can't parse natively. HEIC is NOT decodable
 * this way in most browsers — convert it with the HEIC tool first.
 */
export async function imageToPngBytes(file: File | Blob): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.drawImage(bitmap, 0, 0)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Canvas toBlob failed')
    return new Uint8Array(await blob.arrayBuffer())
  }
  finally {
    bitmap.close()
  }
}
