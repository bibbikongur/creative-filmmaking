// Shared definitions for the location-map tool (tökustaðakort): marker kinds,
// tile sources and small factories. Used by both the Leaflet editor and the
// canvas/PDF exporter so pins look identical on screen and on paper.

import type { LocationMapPage, LocationMarkerKind, VehicleMarkerKind } from '~/types'

export interface MarkerKindDef {
  kind: LocationMarkerKind
  /** Pin fill color. */
  color: string
  /** 1–2 letter glyph drawn inside the pin (canvas + divIcon friendly). */
  glyph: string
  /** i18n key for the kind name (toolbar + PDF legend). */
  labelKey: string
}

// Palette modeled on production overview maps: vivid pins + dark label chips.
export const MARKER_KINDS: MarkerKindDef[] = [
  { kind: 'basecamp', color: '#ff9d00', glyph: 'B', labelKey: 'portal.tools.locationMap.kind.basecamp' },
  { kind: 'set', color: '#e6007e', glyph: 'S', labelKey: 'portal.tools.locationMap.kind.set' },
  { kind: 'parking', color: '#2f80ed', glyph: 'P', labelKey: 'portal.tools.locationMap.kind.parking' },
  { kind: 'trucks', color: '#26c6a2', glyph: 'T', labelKey: 'portal.tools.locationMap.kind.trucks' },
  { kind: 'catering', color: '#f48fb1', glyph: 'C', labelKey: 'portal.tools.locationMap.kind.catering' },
  { kind: 'wc', color: '#8d6eff', glyph: 'WC', labelKey: 'portal.tools.locationMap.kind.wc' },
  { kind: 'custom', color: '#f5f2e9', glyph: '★', labelKey: 'portal.tools.locationMap.kind.custom' },
]

/** True for pale pin colors that need dark accents (outline, glyph) instead of white. */
export function isLightColor(hex: string): boolean {
  const m = /^#([0-9a-f]{6})/i.exec(hex)
  if (!m) return false
  const n = Number.parseInt(m[1]!, 16)
  const lum = 0.299 * ((n >> 16) & 0xFF) + 0.587 * ((n >> 8) & 0xFF) + 0.114 * (n & 0xFF)
  return lum > 190
}

/** Editor pin: teardrop with a white ring, tip at the bottom center (30×40). */
export function pinSvg(color: string, glyph: string): string {
  const light = isLightColor(color)
  const outline = light ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.95)'
  return `<svg width="30" height="40" viewBox="0 0 30 40" style="display:block">`
    + `<path d="M15 38.5 C15 38.5 3 24.5 3 14.8 A12 12 0 1 1 27 14.8 C27 24.5 15 38.5 15 38.5 Z" fill="${color}" stroke="${outline}" stroke-width="2"/>`
    + `<circle cx="15" cy="14.8" r="5.6" fill="${light ? '#2b2b2b' : '#ffffff'}"/>`
    + `<text x="15" y="14.8" dy="0.36em" text-anchor="middle" font-family="Inter, sans-serif" font-size="${glyph.length > 1 ? 5.5 : 7.5}" font-weight="700" fill="${light ? '#f5f2e9' : '#333333'}">${glyph}</text>`
    + `</svg>`
}

/** Text-box colors (first entry — production gold — is the default). */
export const TEXT_COLORS = ['#ffd75e', '#f5f2e9', '#e6007e', '#ff9d00', '#26c6a2', '#f48fb1']
export const DEFAULT_TEXT_COLOR = TEXT_COLORS[0]!

export const markerKindDef = (kind: LocationMarkerKind): MarkerKindDef =>
  MARKER_KINDS.find(k => k.kind === kind) ?? MARKER_KINDS[MARKER_KINDS.length - 1]!

/** Road color palette offered in the editor (first entry is the default). */
export const ROAD_COLORS = ['#facc15', '#dc2626', '#2563eb', '#16a34a', '#ffffff', '#111111']

// ── True-scale vehicles ──────────────────────────────────────────────────────

export interface VehicleKindDef {
  kind: VehicleMarkerKind
  /** Typical real-world footprint in meters (editable per placed vehicle). */
  lengthM: number
  widthM: number
  labelKey: string
}

/** Typical sizes: 3-axle box truck, semi with trailer, long Sprinter van. */
export const VEHICLE_KINDS: VehicleKindDef[] = [
  { kind: 'truck', lengthM: 10, widthM: 2.55, labelKey: 'portal.tools.locationMap.vehicle.truck' },
  { kind: 'semi', lengthM: 16.5, widthM: 2.55, labelKey: 'portal.tools.locationMap.vehicle.semi' },
  { kind: 'van', lengthM: 7, widthM: 2.05, labelKey: 'portal.tools.locationMap.vehicle.van' },
]

export const vehicleKindDef = (kind: VehicleMarkerKind): VehicleKindDef =>
  VEHICLE_KINDS.find(v => v.kind === kind) ?? VEHICLE_KINDS[0]!

/** Vehicle body colors (second entry — silver — is the default). */
export const VEHICLE_COLORS = ['#f8fafc', '#cbd5e1', '#334155', '#dc2626', '#2563eb', '#facc15']

/** Web Mercator ground resolution (meters per screen pixel, 256px tiles). */
export const metersPerPixel = (lat: number, zoom: number): number =>
  (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom

/**
 * Top-view vehicle drawing as an SVG string, front pointing right. Drawn in
 * decimeter units so proportions (cab, windshield) track the real dimensions;
 * the editor stretches it to the on-screen pixel footprint.
 */
export function vehicleSvg(kind: VehicleMarkerKind, lengthM: number, widthM: number, color: string): string {
  const l = lengthM * 10
  const w = widthM * 10
  const r = (n: number) => Math.round(n * 10) / 10
  const body = `fill="${color}" stroke="rgba(15,23,42,0.9)" stroke-width="1.4"`
  const glass = 'fill="rgba(15,23,42,0.75)"'
  let parts: string
  if (kind === 'semi') {
    // Trailer + separate tractor unit with windshield.
    parts = `<rect x="1" y="1" width="${r(l - 44)}" height="${r(w - 2)}" rx="2.5" ${body} />`
      + `<rect x="${r(l - 39)}" y="${r(w * 0.06)}" width="38" height="${r(w * 0.88)}" rx="4" ${body} />`
      + `<rect x="${r(l - 14)}" y="${r(w * 0.14)}" width="5" height="${r(w * 0.72)}" rx="1.5" ${glass} />`
  }
  else if (kind === 'truck') {
    // Cargo box + cab.
    parts = `<rect x="1" y="1" width="${r(l - 22)}" height="${r(w - 2)}" rx="2.5" ${body} />`
      + `<rect x="${r(l - 20)}" y="${r(w * 0.05)}" width="19" height="${r(w * 0.9)}" rx="4" ${body} />`
      + `<rect x="${r(l - 15)}" y="${r(w * 0.14)}" width="5" height="${r(w * 0.72)}" rx="1.5" ${glass} />`
  }
  else {
    // Van: one rounded body, windshield near the front.
    parts = `<rect x="1" y="1" width="${r(l - 2)}" height="${r(w - 2)}" rx="6" ${body} />`
      + `<rect x="${r(l - 16)}" y="${r(w * 0.14)}" width="5.5" height="${r(w * 0.72)}" rx="2" ${glass} />`
  }
  return `<svg viewBox="0 0 ${r(l)} ${r(w)}" style="width:100%;height:100%;display:block">${parts}</svg>`
}

export interface TileSource {
  url: string
  /** Attribution required by the tile provider — shown on screen and on the PDF. */
  attribution: string
  maxZoom: number
}

// Both providers serve tiles with CORS headers, which the PDF exporter needs
// to draw them onto a canvas without tainting it.
export const TILE_SOURCES: Record<'streets' | 'satellite', TileSource> = {
  streets: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
}

export const tileUrl = (src: TileSource, z: number, x: number, y: number): string =>
  src.url.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y))

// ── Location-photo folder pin colors ─────────────────────────────────────────
// Each filming location ("tökustaður") gets its own pin color; its option
// subfolders inherit it. Distinct, map-legible hues; used on screen and to seed
// a default color per folder before the user picks one.
export const PIN_COLORS = [
  '#e6007e', '#ff9d00', '#2f80ed', '#26c6a2', '#8d6eff',
  '#f2c94c', '#eb5757', '#27ae60', '#f48fb1', '#00b8d9',
]

/** Stable small hash of a string → an index, so a given id always maps to the same color. */
function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Deterministic default pin color for a folder id (used when none is chosen). */
export const pinColorForId = (id: string): string => PIN_COLORS[hashString(id) % PIN_COLORS.length]!

export const newLocalId = (prefix: string): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`

/** Fresh page centered on Reykjavík (the editor's geolocation may move it). */
export const newMapPage = (title: string, base: 'streets' | 'satellite' | 'image' = 'streets'): LocationMapPage => ({
  id: newLocalId('p'),
  title,
  base,
  center: { lat: 64.1355, lng: -21.8954 },
  zoom: 13,
  markers: [],
  roads: [],
  texts: [],
  vehicles: [],
})
