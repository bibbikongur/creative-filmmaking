// Brute-force defense for the single shared admin password.
//
// Two layers, because admin has no per-account key to lock (one secret guards
// everything):
//   1. Per-IP hard lock — 5 failures / 15 min (IP is now the un-spoofable hop,
//      see getClientIp). Stops a single host hammering the endpoint.
//   2. Global progressive delay — every failure across ALL IPs in the window
//      adds latency to the next failed response. This throttles a distributed /
//      spoofed attack that layer 1 can't see, WITHOUT ever hard-locking the
//      owner out (a global lock would be a trivial DoS: just spam wrong
//      passwords). Successful logins are never delayed.
const attempts = new Map<string, { count: number, lockedUntil: number }>()
const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000

const GLOBAL_WINDOW_MS = 15 * 60 * 1000
const GLOBAL_MAX_DELAY_MS = 5000
let globalFails = { count: 0, windowStart: 0 }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default defineEventHandler(async (event) => {
  if (!adminConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Admin panel is not configured. Set the NUXT_ADMIN_PASSWORD environment variable.',
    })
  }

  const ip = getClientIp(event)
  const now = Date.now()
  const entry = attempts.get(ip)
  if (entry && entry.lockedUntil > now) {
    throw createError({ statusCode: 429, statusMessage: 'Too many failed attempts. Try again in 15 minutes.' })
  }

  const body = await readBody<{ password?: string }>(event).catch(() => ({} as { password?: string }))
  if (!passwordMatches(String(body?.password ?? ''))) {
    // Layer 1: per-IP lock.
    const count = (entry?.count ?? 0) + 1
    attempts.set(ip, {
      count,
      lockedUntil: count >= MAX_ATTEMPTS ? now + LOCK_MS : 0,
    })

    // Layer 2: global progressive delay.
    if (now - globalFails.windowStart > GLOBAL_WINDOW_MS) globalFails = { count: 1, windowStart: now }
    else globalFails.count++
    const delay = Math.min(globalFails.count * 250, GLOBAL_MAX_DELAY_MS)
    if (delay) await sleep(delay)

    throw createError({ statusCode: 401, statusMessage: 'Wrong password.' })
  }

  attempts.delete(ip)
  const session = await getAdminSession(event)
  await session.update({ admin: true })
  return { ok: true }
})
