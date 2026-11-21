/**
 * The vehicle type pages have a different last segment per language
 * (/vehicles/kassabilar, /en/vehicles/box-trucks). A request for the other
 * language's segment (/en/vehicles/kassabilar, /vehicles/box-trucks) gets one
 * 301 to the right page, the way items and equipment categories already do.
 * The map lives in server/utils/localisedPaths.ts.
 *
 * This lives in a middleware and not in nuxt.config routeRules on purpose:
 * the sitemap module merges the rules of a path with and without its locale
 * prefix, so a rule on /vehicles/box-trucks made it drop the real page
 * /en/vehicles/box-trucks from the English sitemap.
 */
export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  const url = getRequestURL(event)
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname
  const to = LANDING_REDIRECTS.get(path)
  if (to) return sendRedirect(event, `${to}${url.search}`, 301)
})
