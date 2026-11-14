// Brute-force defense for the single shared admin password (and, when
// two-factor is on, the authenticator code that goes with it).
//
// Layers, because admin has no per-account key to lock (one secret guards
// everything):
//   1. Per-IP hard lock — 5 failures / 15 min (IP is now the un-spoofable hop,
//      see getClientIp). Stops a single host hammering the endpoint.
//   2. Global progressive delay — every failure across ALL IPs in the window
//      adds latency to the next failed response. This throttles a distributed /
//      spoofed attack that layer 1 can't see, WITHOUT ever hard-locking the
//      owner out (a global lock would be a trivial DoS: just spam wrong
//      passwords). Successful logins are never delayed.
//   3. Global code lock — wrong codes sent WITH the right password. Only
//      someone who already has the password can trip it, and that is exactly
//      the attacker the second factor exists for: a 6-digit code would fall to
//      a distributed guessing run that layers 1 and 2 only slow down. After 10
//      such failures in 15 minutes no code is accepted until the window ends.
//
// With two-factor on, every failure answers the same 401, whichever half was
// wrong (and also while layer 3 is locked), so the endpoint never confirms a
// guessed password on its own.
const attempts = new Map<string, { count: number, lockedUntil: number }>()
const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000

const GLOBAL_WINDOW_MS = 15 * 60 * 1000
const GLOBAL_MAX_DELAY_MS = 5000
let globalFails = { count: 0, windowStart: 0 }

const CODE_MAX_FAILS = 10
let codeFails = { count: 0, windowStart: 0 }

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

  const body = await readBody<{ password?: unknown, code?: unknown }>(event).catch(() => null)
  const password = typeof body?.password === 'string' ? body.password : ''
  const code = typeof body?.code === 'string' ? body.code : ''

  const twoFactor = adminTwoFactorEnabled()
  let ok = passwordMatches(password)

  if (ok && twoFactor) {
    if (now - codeFails.windowStart > GLOBAL_WINDOW_MS) codeFails = { count: 0, windowStart: now }
    if (codeFails.count >= CODE_MAX_FAILS) {
      ok = false
    }
    else if (!consumeAdminSecondFactor(code)) {
      ok = false
      // An empty code is the login form asking, not a guess.
      if (code.trim()) {
        codeFails.count++
        if (codeFails.count >= CODE_MAX_FAILS) {
          console.warn('[admin] login: 10 wrong two-factor codes with the correct password; codes locked for 15 minutes. Change NUXT_ADMIN_PASSWORD if this was not you.')
        }
      }
    }
  }

  if (!ok) {
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

    throw createError({
      statusCode: 401,
      statusMessage: twoFactor ? 'Wrong password or code.' : 'Wrong password.',
    })
  }

  attempts.delete(ip)
  await issueAdminSession(event)
  return { ok: true }
})
