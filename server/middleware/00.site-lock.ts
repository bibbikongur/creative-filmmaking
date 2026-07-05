/**
 * Site-wide password gate (HTTP Basic Auth) for the private preview period.
 *
 * Active ONLY when NUXT_SITE_PASSWORD is set. Leave it unset (or delete the
 * Railway variable) to open the site to the public — no code change needed.
 *
 * Optional NUXT_SITE_USER overrides the username (defaults to "preview").
 * Runs first (00. prefix) so it gates every route, page and API alike.
 */
export default defineEventHandler((event) => {
  const password = process.env.NUXT_SITE_PASSWORD
  // No password configured → site is fully public (production default).
  if (!password) return

  const expectedUser = process.env.NUXT_SITE_USER || 'preview'

  const header = getRequestHeader(event, 'authorization') || ''
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
    const sep = decoded.indexOf(':')
    const user = sep === -1 ? decoded : decoded.slice(0, sep)
    const pass = sep === -1 ? '' : decoded.slice(sep + 1)
    if (user === expectedUser && pass === password) return // authorized
  }

  // Set the challenge header BEFORE throwing so the browser shows its native
  // login prompt; then short-circuit with a proper 401 (throwing is the only
  // way to stop a Nitro middleware — returning a body 500s instead).
  setResponseHeader(
    event,
    'WWW-Authenticate',
    'Basic realm="Creative Filmmaking private preview", charset="UTF-8"',
  )
  throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
})
