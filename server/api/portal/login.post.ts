// Brute-force throttle per IP and per email: 5 failed tries locks for 15
// minutes. In-memory is fine for a single-instance deployment.
const attempts = new Map<string, { count: number, lockedUntil: number }>()
const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000

const isLocked = (key: string) => {
  const entry = attempts.get(key)
  return Boolean(entry && entry.lockedUntil > Date.now())
}

const recordFailure = (key: string) => {
  const count = (attempts.get(key)?.count ?? 0) + 1
  attempts.set(key, { count, lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0 })
}

export default defineEventHandler(async (event) => {
  if (!portalConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Portal is not configured. Set NUXT_SESSION_SECRET and NUXT_ENCRYPTION_KEY.',
    })
  }

  const body = await readBody<{ email?: string, password?: string }>(event).catch(() => ({} as Record<string, string>))
  const email = normalizeEmail(String(body?.email ?? ''))
  const password = String(body?.password ?? '')

  const ip = getClientIp(event)
  if (isLocked(`ip:${ip}`) || (email && isLocked(`email:${email}`))) {
    throw createError({ statusCode: 429, statusMessage: 'Too many failed attempts. Try again in 15 minutes.' })
  }

  const fail = () => {
    recordFailure(`ip:${ip}`)
    if (email) recordFailure(`email:${email}`)
    throw createError({ statusCode: 401, statusMessage: 'Wrong email or password.' })
  }

  if (!email || !password) fail()

  const creds = getCredentials(email)
  if (!creds || creds.status !== 'active' || !creds.passwordHash) {
    // Burn comparable CPU so response timing doesn't reveal whether the account exists.
    verifyAgainstDummy(password)
    fail()
  }
  if (!verifyPassword(password, creds!.passwordHash)) fail()

  attempts.delete(`ip:${ip}`)
  attempts.delete(`email:${email}`)

  const session = await getPortalSession(event)
  await session.update({ uid: creds!.id, epoch: getUserEpoch(creds!.id) ?? 0 })

  const user = getUserById(creds!.id)!
  return { ok: true, user, memberships: membershipsForUser(user.id) }
})
