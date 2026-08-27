import { extractCoordsFromMapsUrl } from '~~/app/utils/mapsLink'

// Resolve a Google Maps share link to coordinates. Short links
// (maps.app.goo.gl) carry no coordinates themselves — they live in the URL the
// link redirects to — and the browser can't follow that redirect cross-origin,
// so the portal does it here. SSRF-guarded: only https Google hosts, redirects
// are walked manually with every hop re-checked, and no response body is used.

const ALLOWED_HOSTS = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'g.co',
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.google.is',
  'consent.google.com',
])

const MAX_HOPS = 5

export default defineEventHandler(async (event) => {
  await requirePortalUser(event)
  const raw = String(getQuery(event).url || '').trim()

  let url: URL
  try {
    url = new URL(raw)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Bad URL' })
  }
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported link' })
  }

  let coords = extractCoordsFromMapsUrl(url.href)
  for (let hop = 0; hop < MAX_HOPS && !coords; hop++) {
    let res: Response
    try {
      res = await fetch(url.href, {
        redirect: 'manual',
        signal: AbortSignal.timeout(6000),
        headers: { 'user-agent': 'Mozilla/5.0 (coords resolver)' },
      })
    }
    catch {
      break
    }
    const loc = res.headers.get('location')
    if (!loc) break
    try {
      url = new URL(loc, url)
    }
    catch {
      break
    }
    if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) break
    coords = extractCoordsFromMapsUrl(url.href)
    // Consent interstitials tuck the real URL into ?continue=.
    const cont = url.searchParams.get('continue')
    if (!coords && cont) coords = extractCoordsFromMapsUrl(cont)
  }

  if (!coords) throw createError({ statusCode: 404, statusMessage: 'No coordinates found in the link' })
  return coords
})
