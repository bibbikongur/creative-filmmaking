// Coordinate extraction from Google Maps URLs. Shared by the recce-plan editor
// (client) and the short-link resolver endpoint (server), so keep it pure.

export interface MapsCoords {
  lat: number
  lng: number
}

const inRange = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) && Number.isFinite(lng)
  && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  && (lat !== 0 || lng !== 0)

/**
 * Pull "lat, lng" out of a full Google Maps URL. The place marker
 * (!3d..!4d..) wins over query params, which win over the viewport center
 * (@lat,lng) — the viewport is only where the map was panned, not the pin.
 */
export function extractCoordsFromMapsUrl(url: string): MapsCoords | null {
  const s = (() => {
    try {
      return decodeURIComponent(url)
    }
    catch {
      return url
    }
  })()
  const patterns = [
    /!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,
    /[?&](?:q|query|ll|destination|center)=(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/i,
    /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
  ]
  for (const re of patterns) {
    const m = re.exec(s)
    if (m) {
      const lat = Number(m[1])
      const lng = Number(m[2])
      if (inRange(lat, lng)) return { lat, lng }
    }
  }
  return null
}

/** Google's shortened share links — no coordinates until the redirect is followed. */
export const isShortMapsLink = (url: string): boolean =>
  /^https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl|g\.co)\//i.test(url.trim())
