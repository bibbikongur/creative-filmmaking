// Overview-map rendering for the recce-plan tool. Browser-only: draws OSM
// tiles (same CORS-friendly source as the location-map tool) onto an offscreen
// canvas, adds the driving route and numbered stop pins, and returns a JPEG
// data URL that the PDF exporter embeds as its own page.

import type { LatLng } from '~/types'
import { TILE_SOURCES, tileUrl } from '~/utils/locationMap'

export interface ReccePoint extends LatLng {
  /** Stop number shown inside the pin. */
  n: number
  name: string
}

const FONT = 'Inter, "Segoe UI", sans-serif'
const GOLD = '#A87A1F'
const CHIP_BG = 'rgba(22,22,22,0.78)'
const CREAM = '#f5f2e9'

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
 * Driving route through the points in order, via the public OSRM demo server.
 * Returns null on any failure — the map then falls back to straight dashed
 * lines, and the PDF still gets made.
 */
export async function fetchDrivingRoute(points: LatLng[]): Promise<LatLng[] | null> {
  if (points.length < 2) return null
  try {
    const coords = points.map(p => `${p.lng},${p.lat}`).join(';')
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return null
    const data = await res.json() as { routes?: { geometry?: { coordinates?: [number, number][] } }[] }
    const geo = data.routes?.[0]?.geometry?.coordinates
    if (!Array.isArray(geo) || geo.length < 2) return null
    return geo.map(c => ({ lat: c[1], lng: c[0] }))
  }
  catch {
    return null
  }
}

/** Rounded-rect path helper. */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * Render the overview map to a JPEG data URL (canvas is 2× for print, so the
 * caller should draw it at cw/2 × ch/2 PDF points). Throws when no tiles load
 * (offline) so the caller can skip the page gracefully.
 */
export async function renderRecceOverviewMap(
  points: ReccePoint[],
  route: LatLng[] | null,
  cw = 990,
  ch = 1404,
): Promise<string> {
  const src = TILE_SOURCES.streets
  const s = 2 // print scale — pins/text drawn 2× like the location-map exporter

  // Highest zoom where every point (plus padding) fits the canvas.
  const PAD = 110
  let z = 13
  for (; z > 3; z--) {
    const px = points.map(p => project(p, z))
    const w = Math.max(...px.map(p => p.x)) - Math.min(...px.map(p => p.x))
    const h = Math.max(...px.map(p => p.y)) - Math.min(...px.map(p => p.y))
    if (w <= cw - PAD * 2 && h <= ch - PAD * 2) break
  }
  if (points.length === 1) z = Math.min(z, 11)

  const px = points.map(p => project(p, z))
  const cx = (Math.max(...px.map(p => p.x)) + Math.min(...px.map(p => p.x))) / 2
  const cy = (Math.max(...px.map(p => p.y)) + Math.min(...px.map(p => p.y))) / 2
  const left = cx - cw / 2
  const top = cy - ch / 2

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.fillStyle = '#dcdcd4'
  ctx.fillRect(0, 0, cw, ch)

  // Tile background (wraps x, clips y at the world edge).
  const worldTiles = 2 ** z
  const jobs: Promise<void>[] = []
  let failed = 0
  let total = 0
  for (let tx = Math.floor(left / 256); tx * 256 < left + cw; tx++) {
    for (let ty = Math.floor(top / 256); ty * 256 < top + ch; ty++) {
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

  const toPx = (ll: LatLng) => {
    const p = project(ll, z)
    return { x: p.x - left, y: p.y - top }
  }

  // Route: white casing + gold line. Falls back to dashed straight legs.
  const line = route ?? points
  if (line.length >= 2) {
    const pts = line.map(toPx)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(pts[0]!.x, pts[0]!.y)
    for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y)
    ctx.setLineDash([])
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 4 * s + 4
    ctx.stroke()
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 4 * s
    if (!route) ctx.setLineDash([7 * s, 6 * s])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Numbered pins (teardrop like the location-map exporter) + name chips.
  for (const pt of points) {
    const p = toPx(pt)
    const cyHead = p.y - 23.7 * s
    const r = 12 * s

    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 3 * s
    ctx.shadowOffsetY = 1.5 * s
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.bezierCurveTo(p.x, p.y, p.x - r, p.y - 14 * s, p.x - r, cyHead)
    ctx.arc(p.x, cyHead, r, Math.PI, Math.PI * 2, false)
    ctx.bezierCurveTo(p.x + r, p.y - 14 * s, p.x, p.y, p.x, p.y)
    ctx.closePath()
    ctx.fillStyle = GOLD
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.lineWidth = 2 * s
    ctx.stroke()
    ctx.restore()

    ctx.beginPath()
    ctx.arc(p.x, cyHead, 6.5 * s, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.fillStyle = '#333333'
    const num = String(pt.n)
    ctx.font = `700 ${(num.length > 1 ? 6.5 : 8) * s}px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(num, p.x, cyHead + 0.5 * s)

    if (pt.name) {
      const label = pt.name.toUpperCase().slice(0, 22)
      const fontPx = 10 * s
      ctx.font = `700 ${fontPx}px ${FONT}`
      const w = ctx.measureText(label).width
      const padX = fontPx * 0.7
      const h = fontPx * 1.7
      roundRect(ctx, p.x - w / 2 - padX, p.y + 3 * s, w + padX * 2, h, 3 * s)
      ctx.fillStyle = CHIP_BG
      ctx.fill()
      ctx.fillStyle = CREAM
      ctx.fillText(label, p.x, p.y + 3 * s + h / 2 + fontPx * 0.06)
    }
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }

  // Attribution (required by the tile provider).
  ctx.font = `400 ${8.5 * s}px ${FONT}`
  const attr = src.attribution
  const aw = ctx.measureText(attr).width
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillRect(cw - aw - 10 * s, ch - 16 * s, aw + 10 * s, 16 * s)
  ctx.fillStyle = '#333333'
  ctx.fillText(attr, cw - aw - 5 * s, ch - 8 * s)

  return canvas.toDataURL('image/jpeg', 0.9)
}
