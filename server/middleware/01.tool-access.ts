// Enforces per-user helper-tool access (portal_users.tool_access) for every
// server-backed tool API in one place, so individual handlers stay unchanged.
// Client-only tools (PDF merge, HEIC convert…) have no API to protect — hiding
// them is handled in the UI, and they never touch the server anyway.
//
// No user on the request → fall through and let the endpoint 401 as usual.

const TOOL_ROUTES: { pattern: RegExp, slugs: string[] }[] = [
  { pattern: /^\/api\/portal\/tools\/location-maps(\/|$)/, slugs: ['location-map'] },
  { pattern: /^\/api\/portal\/tools\/location-albums(\/|$)/, slugs: ['location-photos'] },
  { pattern: /^\/api\/portal\/tools\/recce-plans(\/|$)/, slugs: ['recce-plan'] },
  { pattern: /^\/api\/portal\/tools\/purchase-orders(\/|$)/, slugs: ['purchase-orders'] },
  // Shared helper used by both map-based tools — allowed with either.
  { pattern: /^\/api\/portal\/tools\/resolve-maps-link$/, slugs: ['location-map', 'recce-plan'] },
  { pattern: /^\/api\/portal\/jobs\/[^/]+\/purchase-orders(\/|$)/, slugs: ['purchase-orders'] },
]

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? ''
  if (!path.startsWith('/api/portal/')) return

  const route = TOOL_ROUTES.find(r => r.pattern.test(path))
  if (!route) return

  const user = await getPortalUser(event)
  if (!user) return // the endpoint's own auth answers 401

  const allowed: string[] = allowedToolsFor(user.id)
  if (!route.slugs.some(slug => allowed.includes(slug))) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this tool' })
  }
})
