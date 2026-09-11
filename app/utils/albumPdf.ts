// Client-side PDF export for the location-photo tool: a tidy gallery PDF of the
// photos picked from a location ("tökustaður"). Each photo gets its own A4 page
// with a dark title band carrying the location name (matching the recce/offer
// chrome), the image scaled to fit, and its caption underneath. Built-in
// Helvetica covers Icelandic (ð/þ/æ/ö are WinAnsi).

import type { PDFFont } from 'pdf-lib'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface AlbumPdfPhoto {
  /** Same-origin URL of the full image (authenticated cookie is sent). */
  url: string
  caption?: string
}

// A4 portrait in PDF points.
const PAGE_W = 595.28
const PAGE_H = 841.89
const M = 44
const BAND_H = 48

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}
const BAND = hex('#1B2A4A')
const TITLE_GOLD = hex('#F2E18C')
const INK = hex('#1A1A1F')
const GRAY = hex('#6B6B74')

const CP1252_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')
/** Drop anything Helvetica/WinAnsi can't encode so drawText never throws. */
const safe = (s: string): string =>
  [...(s || '').normalize('NFC')].filter(c => c.charCodeAt(0) < 0x100 || CP1252_EXTRA.has(c)).join('')

/** Greedy word wrap; hard-breaks words wider than the column. */
function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = []
  for (const raw of text.split('\n')) {
    const words = raw.split(/\s+/).filter(Boolean)
    let line = ''
    for (let w of words) {
      while (font.widthOfTextAtSize(w, size) > maxW && w.length > 1) {
        let cut = w.length - 1
        while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > maxW) cut--
        if (line) { out.push(line); line = '' }
        out.push(w.slice(0, cut))
        w = w.slice(cut)
      }
      const cand = line ? `${line} ${w}` : w
      if (font.widthOfTextAtSize(cand, size) <= maxW) line = cand
      else { if (line) out.push(line); line = w }
    }
    if (line) out.push(line)
  }
  return out
}

/**
 * Fetch an image and return JPEG bytes pdf-lib can embed. JPEGs pass through
 * untouched; anything else (PNG/WebP) is re-encoded to JPEG via canvas.
 */
async function fetchAsJpeg(url: string): Promise<Uint8Array> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load image (${res.status})`)
  const blob = await res.blob()
  if (blob.type === 'image/jpeg') return new Uint8Array(await blob.arrayBuffer())
  const bitmap = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.drawImage(bitmap, 0, 0)
    const out = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!out) throw new Error('Canvas toBlob failed')
    return new Uint8Array(await out.arrayBuffer())
  }
  finally {
    bitmap.close()
  }
}

/**
 * Build the gallery PDF. `onProgress(done, total)` fires as each image loads so
 * the page can show progress. One photo per page, name band on top.
 */
export async function exportAlbumPdf(
  name: string,
  photos: AlbumPdfPhoto[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const title = safe(name.trim()) || 'Tökustaður'

  const total = photos.length
  for (let i = 0; i < total; i++) {
    const photo = photos[i]!
    const page = pdf.addPage([PAGE_W, PAGE_H])

    // Title band with the location name + page counter.
    page.drawRectangle({ x: 0, y: PAGE_H - BAND_H, width: PAGE_W, height: BAND_H, color: BAND })
    page.drawText(title, { x: M, y: PAGE_H - BAND_H + 18, size: 15, font: bold, color: TITLE_GOLD })
    const counter = total > 1 ? `${i + 1} / ${total}` : ''
    if (counter) {
      const cw = font.widthOfTextAtSize(counter, 10)
      page.drawText(counter, { x: PAGE_W - M - cw, y: PAGE_H - BAND_H + 20, size: 10, font, color: TITLE_GOLD })
    }

    // Caption (wrapped) reserves space at the bottom.
    const caption = safe((photo.caption ?? '').trim())
    const capLines = caption ? wrap(caption, font, 10, PAGE_W - 2 * M) : []
    const capH = capLines.length ? capLines.length * 13 + 10 : 0

    // Image area between the band and the caption/footer.
    const areaTop = PAGE_H - BAND_H - 20
    const areaBottom = M + capH
    const areaW = PAGE_W - 2 * M
    const areaH = areaTop - areaBottom

    let jpeg: Uint8Array | null = null
    try {
      jpeg = await fetchAsJpeg(photo.url)
    }
    catch {
      jpeg = null
    }
    onProgress?.(i + 1, total)

    if (jpeg) {
      const img = await pdf.embedJpg(jpeg)
      const scale = Math.min(areaW / img.width, areaH / img.height)
      const w = img.width * scale
      const h = img.height * scale
      page.drawImage(img, { x: M + (areaW - w) / 2, y: areaBottom + (areaH - h) / 2, width: w, height: h })
    }
    else {
      page.drawText('(mynd hlóðst ekki)', { x: M, y: areaTop - 20, size: 11, font, color: GRAY })
    }

    // Caption lines under the image.
    let cy = M + capH - 13
    for (const line of capLines) {
      page.drawText(line, { x: M, y: cy, size: 10, font, color: INK })
      cy -= 13
    }
  }

  return pdf.save()
}

/** Filesystem-safe base name from a folder name. */
export function pdfFileName(name: string): string {
  const base = (name || 'tokustadur').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_').slice(0, 80)
  return `${base || 'tokustadur'}.pdf`
}
