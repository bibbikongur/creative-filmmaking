// Cross-site request guard for every state-changing API call.
//
// The session cookies are SameSite=Lax, which already keeps them off cross-site
// POSTs from unrelated sites. It does NOT cover a "same-site" origin: any other
// host under our own domain (a future subdomain, a forgotten DNS record) counts
// as same-site and could drive the admin or portal API as the signed-in user.
// So the API also refuses any write that a browser says came from another
// origin.
//
// Sec-Fetch-Site is set by the browser itself and cannot be changed by page
// script. Where it is missing (old browsers), Origin is compared to our own
// host. Requests with neither header are not from a browser page (curl,
// server-to-server) and carry no ambient cookies worth protecting.
export default defineEventHandler((event) => {
  const method = event.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return
  if (!event.path.startsWith('/api/')) return

  const refuse = () => {
    throw createError({ statusCode: 403, statusMessage: 'Cross-site request refused.' })
  }

  const site = getRequestHeader(event, 'sec-fetch-site')
  if (site) {
    // "none" = typed/bookmarked navigation, never a third-party page.
    if (site !== 'same-origin' && site !== 'none') refuse()
    return
  }

  const origin = getRequestHeader(event, 'origin')
  if (!origin) return
  let originHost = ''
  try { originHost = new URL(origin).host.toLowerCase() }
  catch { refuse() }

  const hosts = new Set<string>()
  const add = (h?: string) => { if (h) hosts.add(h.split(',')[0]!.trim().toLowerCase()) }
  add(getRequestHeader(event, 'x-forwarded-host'))
  add(getRequestHeader(event, 'host'))
  try { add(new URL(String(useRuntimeConfig().public.siteUrl)).host) }
  catch { /* no configured site URL */ }
  if (!hosts.has(originHost)) refuse()
})
