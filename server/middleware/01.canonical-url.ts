/**
 * Canonical-URL redirects: one host, no trailing slashes.
 *
 * Railway serves both creativefilmmaking.is and www.creativefilmmaking.is, and
 * Nuxt renders /vehicles and /vehicles/ alike, so without this every page had
 * up to four addresses. Canonical tags paper over that for Google, but links
 * and crawl budget still split. A single 301 to the apex host without a
 * trailing slash keeps everything on one URL per page.
 *
 * Scope: GET/HEAD page requests only. Assets, the API, image routes and the
 * sitemap are left alone, and hosts other than "www.<apex>" (Railway preview
 * domains, localhost) are never redirected so previews keep working.
 */
const SKIP_PREFIXES = ['/api/', '/_nuxt/', '/_ipx/', '/_fonts/', '/uploads/', '/__sitemap__/', '/__nuxt']

export default defineEventHandler((event) => {
  if (import.meta.dev) return
  const method = event.method
  if (method !== 'GET' && method !== 'HEAD') return

  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true })
  const path = url.pathname
  if (SKIP_PREFIXES.some(p => path.startsWith(p))) return
  // Files (robots.txt, sitemap_index.xml, favicon.svg, …) are never slashed or duplicated.
  if (/\.[a-z0-9]{2,5}$/i.test(path)) return

  const canonical = new URL(useRuntimeConfig(event).public.siteUrl)
  let host = url.hostname
  let pathname = path

  if (host === `www.${canonical.hostname}`) host = canonical.hostname
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.replace(/\/+$/, '') || '/'

  if (host === url.hostname && pathname === path) return

  // Only ever redirect onto the canonical origin; anything else is left as is.
  if (host !== canonical.hostname) return
  return sendRedirect(event, `${canonical.origin}${pathname}${url.search}`, 301)
})
