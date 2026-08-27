// Client-side PDF export for the location-map tool. Each page is rendered to
// an offscreen canvas — map tiles (or the uploaded image) plus roads, pins and
// text boxes — then embedded as a full-bleed JPEG on an A4 landscape page.
//
// Map pages re-fetch the tiles for the saved viewport at zoom+1 (both tile
// providers send CORS headers), so the PDF covers the same area as an
// 842×595 px editor viewport but at print resolution.

import { PDFDocument, PDFName, PDFString } from 'pdf-lib'
import type { LatLng, LocationMapDoc, LocationMapPage, LocationMapVehicle, LocationMarkerKind } from '~/types'
import { DEFAULT_TEXT_COLOR, isLightColor, markerKindDef, metersPerPixel, TILE_SOURCES, tileUrl } from '~/utils/locationMap'

// A4 landscape in PDF points; canvas renders at 2× for print sharpness.
const PAGE_W = 841.89
const PAGE_H = 595.28
const VIEW_W = 842
const VIEW_H = 595
const SCALE = 2
const CANVAS_W = VIEW_W * SCALE
const CANVAS_H = VIEW_H * SCALE

const FONT = 'Inter, "Segoe UI", sans-serif'
/** Production-map chrome: dark chips, gold headline. */
const CHIP_BG = 'rgba(22,22,22,0.78)'
const TITLE_GOLD = '#f2e18c'
const CREAM = '#f5f2e9'

/** Dark rounded chip with colored text; returns nothing, draws centered-x at cx. */
function drawChip(ctx: CanvasRenderingContext2D, cx: number, top: number, text: string, color: string, fontPx: number) {
  ctx.font = `700 ${fontPx}px ${FONT}`
  const w = ctx.measureText(text).width
  const padX = fontPx * 0.8
  const h = fontPx * 1.7
  roundRect(ctx, cx - w / 2 - padX, top, w + padX * 2, h, 3 * SCALE)
  ctx.fillStyle = CHIP_BG
  ctx.fill()
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, top + h / 2 + fontPx * 0.06)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

export interface ExportLabels {
  /** Heading of the clickable pin index (bottom-left). */
  locationsTitle: string
  /** Fallback name for a numbered set pin without a label ("Location {n}"). */
  locationName: (n: number) => string
  /** Localized kind name — fallback for unlabeled pins ("Basecamp", "Parking"…). */
  kindName: (kind: LocationMarkerKind) => string
}

/**
 * One index row per pin — EVERY pin gets a Google Maps link. Names: custom
 * label (numbered set pins get a "N ·" prefix), "Location N" for numbered set
 * pins, otherwise the kind name (counted when several unlabeled pins share it).
 * Ordering: locations (set pins) always come first as one unbroken block,
 * sorted by number; every other pin follows in placement order.
 * Exported for tests.
 */
export function buildIndexRows(page: LocationMapPage, labels: ExportLabels): { m: LocationMapPage['markers'][number], name: string }[] {
  const unlabeledPerKind = new Map<string, number>()
  for (const m of page.markers) {
    if (!m.label && !(m.kind === 'set' && m.num)) {
      unlabeledPerKind.set(m.kind, (unlabeledPerKind.get(m.kind) ?? 0) + 1)
    }
  }
  const counters = new Map<string, number>()
  const rows = page.markers.map((m) => {
    let name: string
    if (m.label) name = m.kind === 'set' && m.num ? `${m.num} · ${m.label}` : m.label
    else if (m.kind === 'set' && m.num) name = labels.locationName(m.num)
    else {
      const i = (counters.get(m.kind) ?? 0) + 1
      counters.set(m.kind, i)
      name = unlabeledPerKind.get(m.kind)! > 1 ? `${labels.kindName(m.kind)} ${i}` : labels.kindName(m.kind)
    }
    return { m, name: name.toUpperCase() }
  })
  // Stable sort: the location block first (by number), everything else keeps
  // its placement order below it.
  return rows.sort((a, b) => {
    const aSet = a.m.kind === 'set'
    const bSet = b.m.kind === 'set'
    if (aSet !== bSet) return aSet ? -1 : 1
    if (aSet && bSet) return (a.m.num ?? Number.MAX_SAFE_INTEGER) - (b.m.num ?? Number.MAX_SAFE_INTEGER)
    return 0
  })
}

/** A clickable region on the finished page, in canvas pixels from the top-left. */
interface LinkRect {
  x: number
  y: number
  w: number
  h: number
  url: string
}

/** Web Mercator: latlng -> world pixel at `zoom` (256px tiles). */
function project(ll: LatLng, zoom: number): { x: number, y: number } {
  const size = 256 * 2 ** zoom
  const s = Math.min(Math.max(Math.sin((ll.lat * Math.PI) / 180), -0.9999), 0.9999)
  return {
    x: ((ll.lng + 180) / 360) * size,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * size,
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`image failed: ${src.slice(0, 64)}`))
    img.src = src
  })
}

/** The zoom the tiles (and true-scale vehicles) are rendered at: zoom+1 so
 * 1 canvas px = 1 world px at 2× the saved zoom — same geographic extent as
 * the saved viewport, double the detail. */
export const exportZoom = (page: LocationMapPage): number =>
  Math.min(page.zoom + 1, TILE_SOURCES[page.base === 'satellite' ? 'satellite' : 'streets'].maxZoom)

/** Draw the tile background; returns the latlng -> canvas px projector. */
async function drawTileBase(ctx: CanvasRenderingContext2D, page: LocationMapPage): Promise<(ll: LatLng) => { x: number, y: number }> {
  const src = TILE_SOURCES[page.base === 'satellite' ? 'satellite' : 'streets']
  const z = exportZoom(page)
  const worldTiles = 2 ** z
  const center = project(page.center, z)
  const left = center.x - CANVAS_W / 2
  const top = center.y - CANVAS_H / 2

  ctx.fillStyle = '#dcdcd4'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  const jobs: Promise<void>[] = []
  let failed = 0
  let total = 0
  for (let tx = Math.floor(left / 256); tx * 256 < left + CANVAS_W; tx++) {
    for (let ty = Math.floor(top / 256); ty * 256 < top + CANVAS_H; ty++) {
      if (ty < 0 || ty >= worldTiles) continue
      const wrappedX = ((tx % worldTiles) + worldTiles) % worldTiles
      total++
      jobs.push(
        loadImage(tileUrl(src, z, wrappedX, ty))
          .then((img) => { ctx.drawImage(img, tx * 256 - left, ty * 256 - top, 256, 256) })
          .catch(() => { failed++ }),
      )
    }
  }
  await Promise.all(jobs)
  if (total > 0 && failed === total) throw new Error('all tiles failed to load')

  return ll => {
    const p = project(ll, z)
    return { x: p.x - left, y: p.y - top }
  }
}

/** Draw the uploaded background image (contain-fit); returns the projector. */
async function drawImageBase(ctx: CanvasRenderingContext2D, page: LocationMapPage): Promise<(ll: LatLng) => { x: number, y: number }> {
  const img = await loadImage(page.image!)
  const w = page.imageW || img.width
  const h = page.imageH || img.height
  const s = Math.min(CANVAS_W / w, CANVAS_H / h)
  const ox = (CANVAS_W - w * s) / 2
  const oy = (CANVAS_H - h * s) / 2

  ctx.fillStyle = '#e8e8e2'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.drawImage(img, ox, oy, w * s, h * s)

  // Image pages use Leaflet CRS.Simple: lng = x from the left, lat = y from
  // the BOTTOM of the image.
  return ll => ({ x: ox + ll.lng * s, y: oy + (h - ll.lat) * s })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawOverlays(ctx: CanvasRenderingContext2D, page: LocationMapPage, toPx: (ll: LatLng) => { x: number, y: number }) {
  // Shapes first — zone outlines/fills sit under everything else.
  for (const sh of page.shapes ?? []) {
    const pa = toPx(sh.a)
    const pb = toPx(sh.b)
    ctx.beginPath()
    if (sh.shape === 'rect') {
      ctx.rect(Math.min(pa.x, pb.x), Math.min(pa.y, pb.y), Math.abs(pb.x - pa.x), Math.abs(pb.y - pa.y))
    }
    else {
      ctx.arc(pa.x, pa.y, Math.hypot(pb.x - pa.x, pb.y - pa.y), 0, Math.PI * 2)
    }
    if (sh.fill) {
      ctx.globalAlpha = sh.fillOpacity
      ctx.fillStyle = sh.color
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.strokeStyle = sh.color
    ctx.lineWidth = sh.width * SCALE
    ctx.setLineDash([])
    ctx.stroke()
  }

  // Roads next (under the pins). A soft white casing keeps them readable on
  // both dark satellite imagery and busy street maps.
  for (const road of page.roads) {
    const pts = road.points.map(toPx)
    if (pts.length < 2) continue
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(pts[0]!.x, pts[0]!.y)
    for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y)
    ctx.setLineDash([])
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = road.width * SCALE + 4
    ctx.stroke()
    ctx.strokeStyle = road.color
    ctx.lineWidth = road.width * SCALE
    if (road.dashed) ctx.setLineDash([6 * SCALE, 5 * SCALE])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // True-scale vehicles (map pages only): meters -> canvas px at the export
  // zoom, rotated around their center. Under the pins and text boxes.
  if (page.base !== 'image') {
    const z = exportZoom(page)
    for (const v of page.vehicles ?? []) {
      const mpp = metersPerPixel(v.lat, z)
      const lPx = v.lengthM / mpp
      const wPx = v.widthM / mpp
      const p = toPx(v)
      const rad = (v.rotation * Math.PI) / 180
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(rad)
      drawVehicleShape(ctx, v, lPx, wPx)
      ctx.restore()
      if (v.label) {
        const vExt = Math.abs(lPx * Math.sin(rad)) + Math.abs(wPx * Math.cos(rad))
        ctx.font = `600 ${12 * SCALE}px ${FONT}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.lineWidth = 3 * SCALE
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'
        ctx.strokeText(v.label, p.x, p.y + vExt / 2 + 3 * SCALE)
        ctx.fillStyle = '#111111'
        ctx.fillText(v.label, p.x, p.y + vExt / 2 + 3 * SCALE)
        ctx.textAlign = 'left'
      }
    }
  }

  // Text boxes: uppercase colored text on a dark chip (production-map style),
  // anchored at the latlng top-left.
  for (const t of page.texts) {
    const p = toPx(t)
    const size = t.size * SCALE
    ctx.font = `700 ${size}px ${FONT}`
    const lines = t.text.toUpperCase().split('\n')
    const wMax = Math.max(...lines.map(l => ctx.measureText(l).width))
    const pad = size * 0.6
    const lineH = size * 1.4
    roundRect(ctx, p.x, p.y, wMax + pad * 2, lines.length * lineH + pad, 3 * SCALE)
    ctx.fillStyle = CHIP_BG
    ctx.fill()
    ctx.fillStyle = t.color || DEFAULT_TEXT_COLOR
    ctx.textBaseline = 'top'
    lines.forEach((l, i) => ctx.fillText(l, p.x + pad, p.y + pad * 0.55 + i * lineH))
  }

  // Pins: teardrop with a ring, tip on the spot — mirrors pinSvg() (30×40 css px).
  for (const m of page.markers) {
    const def = markerKindDef(m.kind)
    const light = isLightColor(def.color)
    const p = toPx(m)
    const s = SCALE
    const cy = p.y - 23.7 * s // head center (tip at p.y)
    const r = 12 * s

    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 3 * s
    ctx.shadowOffsetY = 1.5 * s
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.bezierCurveTo(p.x, p.y, p.x - r, p.y - 14 * s, p.x - r, cy)
    ctx.arc(p.x, cy, r, Math.PI, Math.PI * 2, false) // over the top
    ctx.bezierCurveTo(p.x + r, p.y - 14 * s, p.x, p.y, p.x, p.y)
    ctx.closePath()
    ctx.fillStyle = def.color
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.strokeStyle = light ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.95)'
    ctx.lineWidth = 2 * s
    ctx.stroke()
    ctx.restore()

    ctx.beginPath()
    ctx.arc(p.x, cy, 5.6 * s, 0, Math.PI * 2)
    ctx.fillStyle = light ? '#2b2b2b' : '#ffffff'
    ctx.fill()
    // Numbered set pins show their location number instead of the kind glyph.
    const glyph = m.kind === 'set' && m.num ? String(m.num) : def.glyph
    ctx.fillStyle = light ? CREAM : '#333333'
    ctx.font = `700 ${(glyph.length > 1 ? 5.5 : 7.5) * s}px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(glyph, p.x, cy + 0.5 * s)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'

    const chip = m.label ? m.label.toUpperCase() : (m.kind === 'set' && m.num ? `LOCATION ${m.num}` : '')
    if (chip) drawChip(ctx, p.x, p.y + 3 * SCALE, chip, def.color, 11 * SCALE)
  }
  ctx.textBaseline = 'alphabetic'
}

/** Top-view vehicle centered on the origin, front pointing +x. Mirrors the
 * proportions of vehicleSvg() in locationMap.ts so print matches screen. */
function drawVehicleShape(ctx: CanvasRenderingContext2D, v: LocationMapVehicle, lPx: number, wPx: number) {
  const pxm = lPx / v.lengthM // canvas px per meter
  const stroke = () => {
    ctx.fillStyle = v.color
    ctx.fill()
    ctx.strokeStyle = 'rgba(15,23,42,0.9)'
    ctx.lineWidth = Math.max(1, 0.14 * pxm)
    ctx.stroke()
  }
  const glass = (x: number, w: number, h: number) => {
    roundRect(ctx, x, -h / 2, w, h, 0.15 * pxm)
    ctx.fillStyle = 'rgba(15,23,42,0.75)'
    ctx.fill()
  }
  const x0 = -lPx / 2
  if (v.kind === 'semi') {
    roundRect(ctx, x0, -wPx / 2, lPx - 4.4 * pxm, wPx, 0.25 * pxm)
    stroke()
    roundRect(ctx, lPx / 2 - 3.9 * pxm, -wPx * 0.44, 3.8 * pxm, wPx * 0.88, 0.4 * pxm)
    stroke()
    glass(lPx / 2 - 1.4 * pxm, 0.5 * pxm, wPx * 0.72)
  }
  else if (v.kind === 'truck') {
    roundRect(ctx, x0, -wPx / 2, lPx - 2.2 * pxm, wPx, 0.25 * pxm)
    stroke()
    roundRect(ctx, lPx / 2 - 2 * pxm, -wPx * 0.45, 1.9 * pxm, wPx * 0.9, 0.4 * pxm)
    stroke()
    glass(lPx / 2 - 1.5 * pxm, 0.5 * pxm, wPx * 0.72)
  }
  else {
    roundRect(ctx, x0, -wPx / 2, lPx, wPx, 0.6 * pxm)
    stroke()
    glass(lPx / 2 - 1.6 * pxm, 0.55 * pxm, wPx * 0.72)
  }
}

function drawChrome(ctx: CanvasRenderingContext2D, doc: LocationMapDoc, page: LocationMapPage, labels: ExportLabels): LinkRect[] {
  const links: LinkRect[] = []
  // Title card, top-left: gold headline + spaced subtitle on a dark chip,
  // like a production overview map.
  const s = SCALE
  const name = doc.name.toUpperCase()
  const sub = (page.title || '').toUpperCase()
  const titleFont = `700 ${26 * s}px Oswald, ${FONT}`
  const subFont = `600 ${13 * s}px Oswald, ${FONT}`
  ctx.font = titleFont
  const nameW = ctx.measureText(name).width
  ctx.font = subFont
  const prevSpacing = (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing
  ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${2 * s}px`
  const subW = sub ? ctx.measureText(sub).width : 0
  const boxW = Math.max(nameW, subW) + 36 * s
  const boxH = (sub ? 56 : 40) * s
  roundRect(ctx, 12 * s, 12 * s, boxW, boxH, 4 * s)
  ctx.fillStyle = CHIP_BG
  ctx.fill()
  ctx.textBaseline = 'alphabetic'
  ctx.font = titleFont
  ctx.fillStyle = TITLE_GOLD
  ctx.fillText(name, 30 * s, 41 * s)
  if (sub) {
    ctx.font = subFont
    ctx.fillStyle = CREAM
    ctx.fillText(sub, 30 * s, 59 * s)
  }
  ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = prevSpacing || '0px'

  // Location index, bottom-left: every named/numbered pin in its own color
  // (doubling as the legend), linking to Google Maps at the pin's coordinates
  // (link annotations are added by the caller).
  const bottomY = CANVAS_H - 12 * s
  const rows = page.base !== 'image' ? buildIndexRows(page, labels) : []
  if (rows.length) {
    const lineH = 20 * s
    ctx.font = `600 ${12 * s}px ${FONT}`
    const wMax = Math.max(
      ctx.measureText(labels.locationsTitle.toUpperCase()).width,
      ...rows.map(r => ctx.measureText(`${r.name} ↗`).width),
    )
    const boxW = wMax + 44 * s
    const boxH = (rows.length + 1.3) * lineH
    const x = 12 * s
    const y = bottomY - boxH
    roundRect(ctx, x, y, boxW, boxH, 4 * s)
    ctx.fillStyle = CHIP_BG
    ctx.fill()
    ctx.fillStyle = TITLE_GOLD
    ctx.font = `700 ${11 * s}px ${FONT}`
    ctx.fillText(labels.locationsTitle.toUpperCase(), x + 12 * s, y + lineH * 0.9)
    ctx.font = `600 ${12 * s}px ${FONT}`
    rows.forEach(({ m, name }, i) => {
      const def = markerKindDef(m.kind)
      const cy = y + lineH * (i + 1.8)
      ctx.beginPath()
      ctx.arc(x + 18 * s, cy, 6 * s, 0, Math.PI * 2)
      ctx.fillStyle = def.color
      ctx.fill()
      ctx.fillStyle = def.color
      ctx.textBaseline = 'middle'
      ctx.fillText(`${name} ↗`, x + 32 * s, cy)
      ctx.textBaseline = 'alphabetic'
      links.push({
        x: x + 8 * s,
        y: cy - lineH / 2,
        w: boxW - 16 * s,
        h: lineH,
        url: `https://www.google.com/maps?q=${m.lat.toFixed(6)},${m.lng.toFixed(6)}`,
      })
    })
  }

  // Attribution, bottom-right (required by the tile providers).
  if (page.base !== 'image') {
    const attr = TILE_SOURCES[page.base].attribution
    ctx.font = `400 ${8.5 * SCALE}px ${FONT}`
    const aw = ctx.measureText(attr).width
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillRect(CANVAS_W - aw - 10 * SCALE, CANVAS_H - 16 * SCALE, aw + 10 * SCALE, 16 * SCALE)
    ctx.fillStyle = '#333333'
    ctx.fillText(attr, CANVAS_W - aw - 5 * SCALE, CANVAS_H - 8 * SCALE)
  }
  ctx.textBaseline = 'alphabetic'
  return links
}

export async function exportLocationMapPdf(doc: LocationMapDoc, labels: ExportLabels): Promise<Uint8Array> {
  // The title uses the site's heading face — make sure it's in the font cache
  // before canvas text is measured/drawn (canvas won't wait for webfonts).
  await Promise.all([
    document.fonts.load(`700 ${26 * SCALE}px Oswald`),
    document.fonts.load(`600 ${13 * SCALE}px Oswald`),
  ]).catch(() => { /* fall back to Inter */ })

  const pdf = await PDFDocument.create()

  for (const page of doc.pages) {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_W
    canvas.height = CANVAS_H
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')

    const toPx = page.base === 'image'
      ? await drawImageBase(ctx, page)
      : await drawTileBase(ctx, page)
    drawOverlays(ctx, page, toPx)
    const links = drawChrome(ctx, doc, page, labels)

    const jpeg = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92))
    if (!jpeg) throw new Error('Canvas toBlob failed')
    const img = await pdf.embedJpg(new Uint8Array(await jpeg.arrayBuffer()))
    const pdfPage = pdf.addPage([PAGE_W, PAGE_H])
    pdfPage.drawImage(img, { x: 0, y: 0, width: PAGE_W, height: PAGE_H })

    // The page itself is a flat image — clickability comes from PDF link
    // annotations layered over the location-index rows. Canvas px (top-left
    // origin) -> PDF points (bottom-left origin).
    if (links.length) {
      const annots = links.map((l) => {
        const x1 = (l.x / CANVAS_W) * PAGE_W
        const x2 = ((l.x + l.w) / CANVAS_W) * PAGE_W
        const yTop = PAGE_H - (l.y / CANVAS_H) * PAGE_H
        const yBottom = PAGE_H - ((l.y + l.h) / CANVAS_H) * PAGE_H
        return pdf.context.register(pdf.context.obj({
          Type: 'Annot',
          Subtype: 'Link',
          Rect: [x1, yBottom, x2, yTop],
          Border: [0, 0, 0],
          A: { Type: 'Action', S: 'URI', URI: PDFString.of(l.url) },
        }))
      })
      pdfPage.node.set(PDFName.of('Annots'), pdf.context.obj(annots))
    }
  }

  return pdf.save()
}
