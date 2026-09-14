import { randomBytes } from 'node:crypto'
import { roadSignDef } from '~~/app/data/roadSigns'
import type { LocationMapDoc, LocationMapPage, LocationMapSummary, LocationMarkerKind, VehicleMarkerKind } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Location maps (portal tool "tökustaðakort"): per-user saved documents. The
// whole page list — markers, roads, text boxes and any uploaded background
// image (data URL) — is one JSON blob in the location_maps table. Every access
// is scoped by user_id, so one user can never read or write another's maps.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_NAME = 120
const MAX_PAGES = 20
const MAX_MARKERS = 200
const MAX_TEXTS = 100
const MAX_ROADS = 100
const MAX_VEHICLES = 100
const MAX_SHAPES = 100
const MAX_SIGNS = 200
const MAX_ROAD_POINTS = 1000
const MAX_TEXT_LEN = 500
const MAX_LABEL_LEN = 120
/** Whole-document JSON cap; uploaded backgrounds are resized client-side. */
const MAX_PAYLOAD_BYTES = 25 * 1024 * 1024
/** Single uploaded background image (data URL). */
const MAX_IMAGE_BYTES = 6 * 1024 * 1024

const MARKER_KINDS: LocationMarkerKind[] = ['basecamp', 'set', 'parking', 'trucks', 'catering', 'wc', 'custom']
const VEHICLE_KINDS: VehicleMarkerKind[] = ['truck', 'semi', 'van', 'car']
const BASES = ['streets', 'satellite', 'image']

const fail = (message: string): never => {
  throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors: [message] } })
}

/** Finite number within map/pixel bounds, rounded to 6 decimals. */
function num(value: unknown, what: string, max = 100000): number {
  const n = Number(value)
  if (!Number.isFinite(n) || Math.abs(n) > max) fail(`${what} is out of range.`)
  return Math.round(n * 1e6) / 1e6
}

const str = (value: unknown, maxLen: number): string =>
  typeof value === 'string' ? value.slice(0, maxLen) : ''

const localId = (prefix: string, value: unknown): string =>
  typeof value === 'string' && value ? value.slice(0, 40) : `${prefix}-${randomBytes(4).toString('hex')}`

/** Validate a client-supplied name. Pure (no DB) so it's unit-testable. */
export function validateMapName(input: unknown): string {
  const name = typeof input === 'string' ? input.trim().slice(0, MAX_NAME) : ''
  if (!name) fail('Name is required.')
  return name
}

/** Validate the client-supplied page list. Pure (no DB) so it's unit-testable. */
export function validatePages(input: unknown): LocationMapPage[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_PAGES) {
    fail(`Pages must be a list of 1–${MAX_PAGES} entries.`)
  }
  const pages = (input as unknown[]).map((raw, i): LocationMapPage => {
    const p = (raw ?? {}) as Record<string, unknown>
    const where = `Page ${i + 1}`
    if (!BASES.includes(p.base as string)) fail(`${where}: unknown base layer.`)
    const base = p.base as LocationMapPage['base']

    let image: string | undefined
    let imageW: number | undefined
    let imageH: number | undefined
    if (base === 'image') {
      if (typeof p.image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(p.image)) {
        fail(`${where}: image pages need an uploaded picture.`)
      }
      image = p.image as string
      if (image.length > MAX_IMAGE_BYTES) fail(`${where}: background image is too large.`)
      imageW = Math.round(num(p.imageW, `${where} image width`, 20000))
      imageH = Math.round(num(p.imageH, `${where} image height`, 20000))
      if (imageW <= 0 || imageH <= 0) fail(`${where}: bad image dimensions.`)
    }

    const markers = p.markers ?? []
    const roads = p.roads ?? []
    const texts = p.texts ?? []
    const vehicles = p.vehicles ?? [] // absent on docs saved before vehicles existed
    const shapes = p.shapes ?? [] // absent on docs saved before shapes existed
    const signs = p.signs ?? [] // absent on docs saved before road signs existed
    const measures = p.measures ?? [] // absent on docs saved before the measure tool existed
    if (!Array.isArray(markers) || markers.length > MAX_MARKERS) fail(`${where}: too many markers.`)
    if (!Array.isArray(roads) || roads.length > MAX_ROADS) fail(`${where}: too many roads.`)
    if (!Array.isArray(texts) || texts.length > MAX_TEXTS) fail(`${where}: too many text boxes.`)
    if (!Array.isArray(vehicles) || vehicles.length > MAX_VEHICLES) fail(`${where}: too many vehicles.`)
    if (!Array.isArray(shapes) || shapes.length > MAX_SHAPES) fail(`${where}: too many shapes.`)
    if (!Array.isArray(signs) || signs.length > MAX_SIGNS) fail(`${where}: too many road signs.`)
    if (!Array.isArray(measures) || measures.length > 100) fail(`${where}: too many measurements.`)

    const center = (p.center ?? {}) as Record<string, unknown>
    return {
      id: localId('p', p.id),
      title: str(p.title, MAX_NAME).trim(),
      base,
      center: { lat: num(center.lat, `${where} center`), lng: num(center.lng, `${where} center`) },
      zoom: Math.min(22, Math.max(0, Math.round(num(p.zoom, `${where} zoom`)))),
      ...(image ? { image, imageW, imageH } : {}),
      // Editor viewport size (drives the WYSIWYG PDF crop); optional.
      ...(Number.isFinite(Number(p.viewW)) && Number.isFinite(Number(p.viewH))
        ? {
            viewW: Math.min(4000, Math.max(200, Math.round(Number(p.viewW)))),
            viewH: Math.min(4000, Math.max(200, Math.round(Number(p.viewH)))),
          }
        : {}),
      markers: markers.map((m0) => {
        const m = (m0 ?? {}) as Record<string, unknown>
        if (!MARKER_KINDS.includes(m.kind as LocationMarkerKind)) fail(`${where}: unknown marker kind.`)
        const label = str(m.label, MAX_LABEL_LEN).trim()
        const markerNum = Number(m.num)
        return {
          id: localId('m', m.id),
          kind: m.kind as LocationMarkerKind,
          lat: num(m.lat, `${where} marker`),
          lng: num(m.lng, `${where} marker`),
          ...(label ? { label } : {}),
          // Location number (set pins): silently dropped when invalid.
          ...(Number.isFinite(markerNum) && markerNum >= 1 ? { num: Math.min(999, Math.round(markerNum)) } : {}),
        }
      }),
      roads: roads.map((r0) => {
        const r = (r0 ?? {}) as Record<string, unknown>
        const points = r.points
        if (!Array.isArray(points) || points.length < 2 || points.length > MAX_ROAD_POINTS) {
          fail(`${where}: a road needs 2–${MAX_ROAD_POINTS} points.`)
        }
        const color = str(r.color, 20)
        if (!/^#[0-9a-f]{3,8}$/i.test(color)) fail(`${where}: bad road color.`)
        return {
          id: localId('r', r.id),
          points: (points as unknown[]).map((pt0) => {
            const pt = (pt0 ?? {}) as Record<string, unknown>
            return { lat: num(pt.lat, `${where} road point`), lng: num(pt.lng, `${where} road point`) }
          }),
          color,
          width: Math.min(20, Math.max(1, Math.round(num(r.width, `${where} road width`)))),
          dashed: !!r.dashed,
        }
      }),
      texts: texts.map((t0) => {
        const t = (t0 ?? {}) as Record<string, unknown>
        const text = str(t.text, MAX_TEXT_LEN).trim()
        if (!text) fail(`${where}: empty text box.`)
        const color = str(t.color, 20)
        return {
          id: localId('t', t.id),
          lat: num(t.lat, `${where} text`),
          lng: num(t.lng, `${where} text`),
          text,
          size: Math.min(72, Math.max(8, Math.round(num(t.size, `${where} text size`)))),
          // Production-map gold unless a valid color was picked.
          color: /^#[0-9a-f]{3,8}$/i.test(color) ? color : '#ffd75e',
        }
      }),
      signs: signs.map((g0) => {
        const g = (g0 ?? {}) as Record<string, unknown>
        const common = {
          id: localId('g', g.id),
          lat: num(g.lat, `${where} sign`),
          lng: num(g.lng, `${where} sign`),
          size: Math.min(160, Math.max(16, Math.round(num(g.size, `${where} sign size`)))),
          // Absent on signs saved before rotation existed → 0.
          rotation: Number.isFinite(Number(g.rotation)) ? ((Math.round(Number(g.rotation)) % 360) + 360) % 360 : 0,
        }
        // Custom uploaded sign: a small raster data URL (resized client-side).
        const custom = str(g.custom, 400000)
        if (custom) {
          if (!/^data:image\/(png|jpeg|webp);base64,/.test(custom)) fail(`${where}: bad custom sign image.`)
          const cw = Math.round(num(g.customW, `${where} custom sign width`, 2000))
          const ch = Math.round(num(g.customH, `${where} custom sign height`, 2000))
          if (cw <= 0 || ch <= 0) fail(`${where}: bad custom sign dimensions.`)
          return { ...common, sign: '', custom, customW: cw, customH: ch }
        }
        // The sign id must exist in the catalogue — that is what makes the
        // /signs/is/<id>.svg URL safe to build client-side.
        const sign = str(g.sign, 60)
        if (!roadSignDef(sign)) fail(`${where}: unknown road sign.`)
        return { ...common, sign }
      }),
      shapes: shapes.map((s0) => {
        const sh = (s0 ?? {}) as Record<string, unknown>
        const kind = sh.shape as 'rect' | 'circle' | 'poly' | 'reserved' | 'arrow'
        if (kind !== 'rect' && kind !== 'circle' && kind !== 'poly' && kind !== 'reserved' && kind !== 'arrow') fail(`${where}: unknown shape.`)
        const color = str(sh.color, 20)
        if (!/^#[0-9a-f]{3,8}$/i.test(color)) fail(`${where}: bad shape color.`)
        const fillOpacity = Number(sh.fillOpacity)
        const common = {
          id: localId('s', sh.id),
          shape: kind,
          color,
          width: Math.min(20, Math.max(1, Math.round(num(sh.width, `${where} shape width`)))),
          fill: !!sh.fill,
          fillOpacity: Number.isFinite(fillOpacity) ? Math.min(1, Math.max(0.05, Math.round(fillOpacity * 100) / 100)) : 0.25,
        }
        if (kind === 'poly') {
          const points = sh.points
          if (!Array.isArray(points) || points.length < 3 || points.length > MAX_ROAD_POINTS) {
            fail(`${where}: a polygon needs 3–${MAX_ROAD_POINTS} points.`)
          }
          return {
            ...common,
            points: (points as unknown[]).map((pt0) => {
              const pt = (pt0 ?? {}) as Record<string, unknown>
              return { lat: num(pt.lat, `${where} shape point`), lng: num(pt.lng, `${where} shape point`) }
            }),
          }
        }
        const a = (sh.a ?? {}) as Record<string, unknown>
        const b = (sh.b ?? {}) as Record<string, unknown>
        const label = str(sh.label, 60).trim()
        return {
          ...common,
          a: { lat: num(a.lat, `${where} shape`), lng: num(a.lng, `${where} shape`) },
          b: { lat: num(b.lat, `${where} shape`), lng: num(b.lng, `${where} shape`) },
          // Rotation applies to rectangles (incl. reserved-parking stamps);
          // absent on shapes saved before rotation existed → 0.
          ...(kind === 'rect' || kind === 'reserved'
            ? { rotation: Number.isFinite(Number(sh.rotation)) ? ((Math.round(Number(sh.rotation)) % 360) + 360) % 360 : 0 }
            : {}),
          ...(kind === 'reserved' && label ? { label } : {}),
        }
      }),
      measures: measures.map((ms0) => {
        const ms = (ms0 ?? {}) as Record<string, unknown>
        const points = ms.points
        if (!Array.isArray(points) || points.length < 2 || points.length > 100) {
          fail(`${where}: a measurement needs 2–100 points.`)
        }
        const color = str(ms.color, 20)
        const width = Number(ms.width)
        return {
          id: localId('d', ms.id),
          points: (points as unknown[]).map((pt0) => {
            const pt = (pt0 ?? {}) as Record<string, unknown>
            return { lat: num(pt.lat, `${where} measure point`), lng: num(pt.lng, `${where} measure point`) }
          }),
          // Styling defaults: gold, 3px, dashed (matches pre-styling measures).
          color: /^#[0-9a-f]{3,8}$/i.test(color) ? color : '#ffd75e',
          width: Number.isFinite(width) ? Math.min(12, Math.max(1, Math.round(width))) : 3,
          dashed: ms.dashed !== false,
        }
      }),
      vehicles: vehicles.map((v0) => {
        const v = (v0 ?? {}) as Record<string, unknown>
        if (!VEHICLE_KINDS.includes(v.kind as VehicleMarkerKind)) fail(`${where}: unknown vehicle kind.`)
        const color = str(v.color, 20)
        const label = str(v.label, MAX_LABEL_LEN).trim()
        return {
          id: localId('v', v.id),
          kind: v.kind as VehicleMarkerKind,
          lat: num(v.lat, `${where} vehicle`),
          lng: num(v.lng, `${where} vehicle`),
          // Real-world meters, clamped to plausible footprints.
          lengthM: Math.min(30, Math.max(0.5, num(v.lengthM, `${where} vehicle length`))),
          widthM: Math.min(6, Math.max(0.5, num(v.widthM, `${where} vehicle width`))),
          rotation: ((Math.round(num(v.rotation, `${where} vehicle rotation`)) % 360) + 360) % 360,
          color: /^#[0-9a-f]{3,8}$/i.test(color) ? color : '#cbd5e1',
          ...(label ? { label } : {}),
        }
      }),
    }
  })
  if (JSON.stringify(pages).length > MAX_PAYLOAD_BYTES) fail('The map is too large to save.')
  return pages
}

function rowToDoc(r: Record<string, unknown>): LocationMapDoc {
  return {
    id: r.id as string,
    name: r.name as string,
    jobId: (r.job_id as string | null) ?? undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    pages: JSON.parse((r.pages as string) || '[]') as LocationMapPage[],
  }
}

/** Pass a jobId to list only that job's maps ("Hjálpargögn" on the job page). */
export function listLocationMaps(userId: string, jobId?: string): LocationMapSummary[] {
  const rows = (jobId
    ? getDb().prepare(`
        SELECT id, name, job_id, updated_at, json_array_length(pages) AS page_count
        FROM location_maps WHERE user_id = ? AND job_id = ? ORDER BY updated_at DESC
      `).all(userId, jobId)
    : getDb().prepare(`
        SELECT id, name, job_id, updated_at, json_array_length(pages) AS page_count
        FROM location_maps WHERE user_id = ? ORDER BY updated_at DESC
      `).all(userId)) as Record<string, unknown>[]
  return rows.map(r => ({
    id: r.id as string,
    name: r.name as string,
    jobId: (r.job_id as string | null) ?? undefined,
    updatedAt: r.updated_at as string,
    pageCount: (r.page_count as number) ?? 0,
  }))
}

export function getLocationMap(userId: string, id: string): LocationMapDoc | null {
  const row = getDb().prepare('SELECT * FROM location_maps WHERE id = ? AND user_id = ?')
    .get(id, userId) as Record<string, unknown> | undefined
  return row ? rowToDoc(row) : null
}

export function createLocationMap(userId: string, name: string, pages: LocationMapPage[], jobId: string | null = null): LocationMapDoc {
  const now = new Date().toISOString()
  const id = newPortalId('lm')
  getDb().prepare('INSERT INTO location_maps (id, user_id, job_id, created_at, updated_at, name, pages) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, userId, jobId, now, now, name, JSON.stringify(pages))
  return { id, name, jobId: jobId ?? undefined, createdAt: now, updatedAt: now, pages }
}

export function updateLocationMap(
  userId: string,
  id: string,
  patch: { name?: string, pages?: LocationMapPage[] },
): LocationMapDoc | null {
  const db = getDb()
  const existing = getLocationMap(userId, id)
  if (!existing) return null
  const name = patch.name ?? existing.name
  const pages = patch.pages ?? existing.pages
  const now = new Date().toISOString()
  db.prepare('UPDATE location_maps SET name = ?, pages = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(name, JSON.stringify(pages), now, id, userId)
  return { ...existing, name, pages, updatedAt: now }
}

export function deleteLocationMap(userId: string, id: string): boolean {
  return getDb().prepare('DELETE FROM location_maps WHERE id = ? AND user_id = ?').run(id, userId).changes > 0
}
