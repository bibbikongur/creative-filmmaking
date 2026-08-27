// Shared Leaflet bootstrap for the portal tools that show a slippy map (the
// location-photo overview + pin picker). Loads Leaflet lazily (it's in
// vite.optimizeDeps.include) and its CSS, and builds a teardrop pin as a divIcon
// so we never depend on Leaflet's default marker image (which bundlers break).

import 'leaflet/dist/leaflet.css'
import type * as Leaflet from 'leaflet'
import { pinSvg } from '~/utils/locationMap'

let cached: typeof Leaflet | null = null

/** Load Leaflet once and reuse it. Vite serves its UMD build as a default export. */
export async function loadLeaflet(): Promise<typeof Leaflet> {
  if (cached) return cached
  const mod = await import('leaflet') as typeof Leaflet & { default?: typeof Leaflet }
  cached = mod.default ?? mod
  return cached
}

/** A production-style teardrop pin (tip at the bottom center), 30×40. */
export function pinDivIcon(L: typeof Leaflet, color = '#e6007e', glyph = ' '): Leaflet.DivIcon {
  return L.divIcon({
    className: 'cf-pin',
    html: pinSvg(color, glyph),
    iconSize: [30, 40],
    iconAnchor: [15, 38],
    popupAnchor: [0, -34],
  })
}

/** Iceland-wide starting view for a fresh, unplaced map. */
export const ICELAND_CENTER: [number, number] = [64.9, -18.9]
export const ICELAND_ZOOM = 6
