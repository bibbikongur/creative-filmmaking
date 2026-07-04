// Brute-force throttle: 5 failed tries per IP locks login for 15 minutes.
// In-memory is fine for a single-instance deployment.
const attempts = new Map<string, { count: number, lockedUntil: number }>()
const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000

export default defineEventHandler(async (event) => {
  if (!adminConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Admin panel is not configured. Set the NUXT_ADMIN_PASSWORD environment variable.',
    })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const entry = attempts.get(ip)
  if (entry && entry.lockedUntil > Date.now()) {
    throw createError({ statusCode: 429, statusMessage: 'Too many failed attempts. Try again in 15 minutes.' })
  }

  const body = await readBody<{ password?: string }>(event).catch(() => ({} as { password?: string }))
  if (!passwordMatches(String(body?.password ?? ''))) {
    const count = (entry?.count ?? 0) + 1
    attempts.set(ip, {
      count,
      lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0,
    })
    throw createError({ statusCode: 401, statusMessage: 'Wrong password.' })
  }

  attempts.delete(ip)
  const session = await getAdminSession(event)
  await session.update({ admin: true })
  return { ok: true }
})
