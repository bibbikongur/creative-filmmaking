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
import { roadSignDef } from '~/data/roadSigns'

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

/**
 * Fractional zoom at which 1 canvas px = 1 world px, chosen so the canvas
 * covers EXACTLY the editor viewport that was saved with the page (WYSIWYG).
 * Old docs without a saved viewport assume the A4 window (842 px wide),
 * which reproduces the previous zoom+1 behavior.
 */
export const exportCanvasZoom = (page: LocationMapPage): number =>
  page.zoom + Math.log2(CANVAS_W / (page.viewW || VIEW_W))

/** Draw the tile background; returns the latlng -> canvas px projector. */
async function drawTileBase(ctx: CanvasRenderingContext2D, page: LocationMapPage): Promise<(ll: LatLng) => { x: number, y: number }> {
  const src = TILE_SOURCES[page.base === 'satellite' ? 'satellite' : 'streets']
  const zc = exportCanvasZoom(page)
  // Fetch tiles at the next integer zoom above (crisper) and scale them down.
  const zt = Math.max(0, Math.min(Math.ceil(zc), src.maxZoom))
  const k = 2 ** (zc - zt) // canvas px per world px at tile zoom
  const worldTiles = 2 ** zt
  const center = project(page.center, zt)
  const left = center.x - CANVAS_W / (2 * k)
  const top = center.y - CANVAS_H / (2 * k)
  const right = left + CANVAS_W / k
  const bottom = top + CANVAS_H / k

  ctx.fillStyle = '#dcdcd4'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  const jobs: Promise<void>[] = []
  let failed = 0
  let total = 0
  for (let tx = Math.floor(left / 256); tx * 256 < right; tx++) {
    for (let ty = Math.floor(top / 256); ty * 256 < bottom; ty++) {
      if (ty < 0 || ty >= worldTiles) continue
      const wrappedX = ((tx % worldTiles) + worldTiles) % worldTiles
      total++
      jobs.push(
        loadImage(tileUrl(src, zt, wrappedX, ty))
          // +1px bleed hides hairline seams from fractional scaling.
          .then((img) => { ctx.drawImage(img, (tx * 256 - left) * k, (ty * 256 - top) * k, 256 * k + 1, 256 * k + 1) })
          .catch(() => { failed++ }),
      )
    }
  }
  await Promise.all(jobs)
  if (total > 0 && failed === total) throw new Error('all tiles failed to load')

  return ll => {
    const p = project(ll, zt)
    return { x: (p.x - left) * k, y: (p.y - top) * k }
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

// Road-sign SVGs, rasterized once per export run. Same-origin fetch, so the
// canvas is never tainted; explicit pixel dimensions are forced onto the SVG
// root so it rasterizes crisply instead of at the 300×150 default.
const signImageCache = new Map<string, Promise<HTMLImageElement>>()
function loadSignImage(sign: string): Promise<HTMLImageElement> {
  let p = signImageCache.get(sign)
  if (!p) {
    p = (async () => {
      const res = await fetch(`/signs/is/${sign}.svg`)
      if (!res.ok) throw new Error(`sign ${sign}: ${res.status}`)
      let svg = await res.text()
      const def = roadSignDef(sign)
      if (def) {
        const scale = Math.min(4, 1600 / Math.max(def.w, def.h))
        svg = svg
          .replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1')
          .replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1')
          .replace(/<svg/, `<svg width="${Math.max(1, Math.round(def.w * scale))}" height="${Math.max(1, Math.round(def.h * scale))}"`)
      }
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
      try {
        return await loadImage(url)
      }
      finally {
        URL.revokeObjectURL(url)
      }
    })()
    signImageCache.set(sign, p)
  }
  return p
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

/** Great-circle distance in meters (matches Leaflet's map.distance closely). */
function haversineM(a: LatLng, b: LatLng): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

const fmtDist = (m: number): string =>
  m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2).replace('.', ',')} km`

/** Measure-chip text follows the line color, except near-black gets cream. */
function measureChipColor(color: string): string {
  const m = /^#([0-9a-f]{6})/i.exec(color)
  if (!m) return color
  const n = Number.parseInt(m[1]!, 16)
  const lum = 0.299 * ((n >> 16) & 0xFF) + 0.587 * ((n >> 8) & 0xFF) + 0.114 * (n & 0xFF)
  return lum < 80 ? CREAM : color
}

/** Word-wrap one chip line to maxW using the current ctx font. */
function wrapLine(ctx: CanvasRenderingContext2D, line: string, maxW: number): string[] {
  const out: string[] = []
  let cur = ''
  for (const word of line.split(/\s+/)) {
    const next = cur ? `${cur} ${word}` : word
    if (cur && ctx.measureText(next).width > maxW) {
      out.push(cur)
      cur = word
    }
    else {
      cur = next
    }
  }
  out.push(cur)
  return out
}

function drawOverlays(ctx: CanvasRenderingContext2D, page: LocationMapPage, toPx: (ll: LatLng) => { x: number, y: number }, signImages: Map<string, HTMLImageElement> | undefined) {
  // Shapes first — zone outlines/fills sit under everything else.
  for (const sh of page.shapes ?? []) {
    if (sh.shape === 'arrow') {
      // Shaft + filled head triangle, mirroring the editor's screen-px head.
      const pa = toPx(sh.a!)
      const pb = toPx(sh.b!)
      const len = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1
      const ux = (pb.x - pa.x) / len
      const uy = (pb.y - pa.y) / len
      const headLen = Math.min((10 + sh.width * 3) * SCALE, len * 0.5)
      const headW = headLen * 0.55
      const base = { x: pb.x - ux * headLen, y: pb.y - uy * headLen }
      ctx.beginPath()
      ctx.moveTo(pa.x, pa.y)
      ctx.lineTo(base.x, base.y)
      ctx.strokeStyle = sh.color
      ctx.lineWidth = sh.width * SCALE
      ctx.lineCap = 'round'
      ctx.setLineDash([])
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(pb.x, pb.y)
      ctx.lineTo(base.x - uy * headW, base.y + ux * headW)
      ctx.lineTo(base.x + uy * headW, base.y - ux * headW)
      ctx.closePath()
      ctx.fillStyle = sh.color
      ctx.fill()
      continue
    }
    ctx.beginPath()
    let center: { x: number, y: number } | null = null
    let corners: { x: number, y: number }[] | null = null
    if (sh.shape === 'poly') {
      const pts = (sh.points ?? []).map(toPx)
      if (pts.length < 3) continue
      ctx.moveTo(pts[0]!.x, pts[0]!.y)
      for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y)
      ctx.closePath()
    }
    else if (sh.shape === 'circle') {
      const pa = toPx(sh.a!)
      const pb = toPx(sh.b!)
      ctx.arc(pa.x, pa.y, Math.hypot(pb.x - pa.x, pb.y - pa.y), 0, Math.PI * 2)
    }
    else {
      // rect / reserved: axis-aligned corners rotated around the center.
      const pa = toPx(sh.a!)
      const pb = toPx(sh.b!)
      center = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }
      const rad = ((sh.rotation ?? 0) * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      corners = ([[pa.x, pa.y], [pb.x, pa.y], [pb.x, pb.y], [pa.x, pb.y]] as const).map(([x, y]) => {
        const dx = x - center!.x
        const dy = y - center!.y
        return { x: center!.x + dx * cos - dy * sin, y: center!.y + dx * sin + dy * cos }
      })
      ctx.moveTo(corners[0]!.x, corners[0]!.y)
      for (const c of corners.slice(1)) ctx.lineTo(c.x, c.y)
      ctx.closePath()
    }
    if (sh.shape === 'reserved' && corners) {
      // Reference style: pale fill + diagonal hatching, clipped to the stamp.
      const xs = corners.map(c => c.x)
      const ys = corners.map(c => c.y)
      const bx = Math.min(...xs)
      const by = Math.min(...ys)
      const bw = Math.max(...xs) - bx
      const bh = Math.max(...ys) - by
      ctx.save()
      ctx.clip()
      ctx.globalAlpha = 0.12
      ctx.fillStyle = sh.color
      ctx.fillRect(bx, by, bw, bh)
      // Stripes stay diagonal RELATIVE TO THE STAMP: rotate the stripe frame
      // with the shape (matches the editor's rotated SVG pattern).
      ctx.globalAlpha = 0.85
      ctx.strokeStyle = sh.color
      ctx.lineWidth = 2.5 * SCALE
      ctx.translate(bx + bw / 2, by + bh / 2)
      ctx.rotate((((sh.rotation ?? 0) + 45) * Math.PI) / 180)
      const R = Math.hypot(bw, bh) / 2 + 4 * SCALE
      ctx.beginPath()
      for (let d = -R; d <= R; d += 12 * SCALE) {
        ctx.moveTo(d, -R)
        ctx.lineTo(d, R)
      }
      ctx.stroke()
      ctx.restore()
      ctx.globalAlpha = 1
      // Solid outline (the hatch pass replaced the path — retrace it).
      ctx.beginPath()
      ctx.moveTo(corners[0]!.x, corners[0]!.y)
      for (const c of corners.slice(1)) ctx.lineTo(c.x, c.y)
      ctx.closePath()
      ctx.strokeStyle = sh.color
      ctx.lineWidth = sh.width * SCALE
      ctx.setLineDash([])
      ctx.stroke()
    }
    else {
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
    // Reserved stamp label — only when the user typed one.
    if (sh.shape === 'reserved' && center && sh.label) {
      const label = sh.label.toUpperCase()
      ctx.font = `800 ${13 * SCALE}px ${FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 3.5 * SCALE
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'
      ctx.strokeText(label, center.x, center.y)
      ctx.fillStyle = sh.color
      ctx.fillText(label, center.x, center.y)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
    }
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

  // Measurements (map pages only): dashed gold line + distance chip at the end.
  if (page.base !== 'image') {
    for (const ms of page.measures ?? []) {
      const pts = ms.points.map(toPx)
      if (pts.length < 2) continue
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(pts[0]!.x, pts[0]!.y)
      for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y)
      const msColor = ms.color ?? '#ffd75e'
      const msWidth = ms.width ?? 3
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth = msWidth * SCALE + 3
      ctx.setLineDash([])
      ctx.stroke()
      ctx.strokeStyle = msColor
      ctx.lineWidth = msWidth * SCALE
      if (ms.dashed ?? true) ctx.setLineDash([4 * SCALE, 8 * SCALE])
      ctx.stroke()
      ctx.setLineDash([])
      let total = 0
      for (let i = 1; i < ms.points.length; i++) total += haversineM(ms.points[i - 1]!, ms.points[i]!)
      // Chip halfway ALONG the drawn path, rotated parallel to that segment
      // and floated just off the line (mirrors the editor).
      const segLens = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i]!.x, p.y - pts[i]!.y))
      const half = segLens.reduce((a, b) => a + b, 0) / 2
      let mid = pts[pts.length - 1]!
      let angle = 0
      let acc = 0
      for (let i = 0; i < segLens.length; i++) {
        if (segLens[i]! > 0 && acc + segLens[i]! >= half) {
          const f = (half - acc) / segLens[i]!
          mid = {
            x: pts[i]!.x + (pts[i + 1]!.x - pts[i]!.x) * f,
            y: pts[i]!.y + (pts[i + 1]!.y - pts[i]!.y) * f,
          }
          angle = Math.atan2(pts[i + 1]!.y - pts[i]!.y, pts[i + 1]!.x - pts[i]!.x)
          if (angle > Math.PI / 2) angle -= Math.PI
          else if (angle < -Math.PI / 2) angle += Math.PI
          break
        }
        acc += segLens[i]!
      }
      ctx.save()
      ctx.translate(mid.x, mid.y)
      ctx.rotate(angle)
      drawChip(ctx, 0, -14 * SCALE - (11.5 * 1.7 * SCALE) / 2, fmtDist(total), measureChipColor(msColor), 11.5 * SCALE)
      ctx.restore()
    }
  }

  // True-scale vehicles (map pages only): meters -> canvas px at the export
  // zoom, rotated around their center. Under the pins and text boxes.
  if (page.base !== 'image') {
    const z = exportCanvasZoom(page)
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

  // Road signs: pre-rasterized SVGs (or custom uploads), centered like the editor.
  for (const sg of page.signs ?? []) {
    const img = signImages?.get(sg.custom ? sg.id : sg.sign)
    if (!img) continue
    const def = roadSignDef(sg.sign)
    const ratio = sg.custom
      ? (sg.customH || 1) / (sg.customW || 1)
      : (def ? def.h / def.w : 1)
    const w = sg.size * SCALE
    const h = w * ratio
    const p = toPx(sg)
    if (sg.rotation) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((sg.rotation * Math.PI) / 180)
      ctx.drawImage(img, -w / 2, -h / 2, w, h)
      ctx.restore()
    }
    else {
      ctx.drawImage(img, p.x - w / 2, p.y - h / 2, w, h)
    }
  }

  // Text boxes: uppercase colored text on a dark chip (production-map style),
  // anchored at the latlng top-left.
  for (const t of page.texts) {
    const p = toPx(t)
    const size = t.size * SCALE
    ctx.font = `700 ${size}px ${FONT}`
    // Wrap long lines inside the chip (matches the editor's 380px max-width).
    const lines = t.text.toUpperCase().split('\n').flatMap(l => wrapLine(ctx, l, 380 * SCALE))
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
  else if (v.kind === 'car') {
    roundRect(ctx, x0, -wPx / 2, lPx, wPx, 0.5 * pxm)
    stroke()
    glass(lPx / 2 - 1.9 * pxm, 0.45 * pxm, wPx * 0.76)
    glass(x0 + 0.2 * lPx, 0.4 * pxm, wPx * 0.7)
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

    // Rasterize this page's road signs up front (cached across pages); a sign
    // that fails to load is skipped rather than failing the whole export.
    // Custom uploaded signs load straight from their data URL, keyed by id.
    const signImages = new Map<string, HTMLImageElement>()
    await Promise.all((page.signs ?? []).map(async (sg) => {
      const key = sg.custom ? sg.id : sg.sign
      if (signImages.has(key)) return
      try {
        signImages.set(key, sg.custom ? await loadImage(sg.custom) : await loadSignImage(sg.sign))
      }
      catch { /* skip this sign */ }
    }))

    drawOverlays(ctx, page, toPx, signImages)
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
