import { createHash, scryptSync, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

// ─────────────────────────────────────────────────────────────────────────────
// Single-password admin auth. NUXT_ADMIN_PASSWORD unlocks the panel; the
// session lives in a sealed (encrypted) cookie. Changing the password
// invalidates all sessions.
//
// The seal key is derived from the password AND NUXT_SESSION_SECRET through
// scrypt. A sealed cookie is something an attacker can test password guesses
// against on their own hardware, past the login rate limit: mixing in the
// random session secret makes that impossible, and the slow hash keeps it
// expensive even on a deploy where the secret is not set.
// ─────────────────────────────────────────────────────────────────────────────

type AdminSession = { admin?: boolean }

export const adminConfigured = () => Boolean(useRuntimeConfig().adminPassword)

let cachedKey: { input: string, key: string } | null = null
function sealKey(adminPassword: string, sessionSecret: string): string {
  const input = JSON.stringify([adminPassword, sessionSecret])
  if (cachedKey?.input !== input) {
    const key = scryptSync(adminPassword, `cf-admin-session:${sessionSecret}`, 32, {
      N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024,
    }).toString('hex')
    cachedKey = { input, key }
  }
  return cachedKey.key
}

const sessionOptions = () => {
  const { adminPassword, sessionSecret } = useRuntimeConfig()
  if (!adminPassword) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Admin panel is not configured. Set the NUXT_ADMIN_PASSWORD environment variable.',
    })
  }
  return {
    name: 'cf-admin',
    password: sealKey(adminPassword, String(sessionSecret || '')),
    maxAge: 60 * 60 * 24 * 7, // 7 days
    // Cookie only: no x-cf-admin-session header transport.
    sessionHeader: false as const,
    cookie: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    },
  }
}

export const getAdminSession = (event: H3Event) =>
  useSession<AdminSession>(event, sessionOptions())

export async function isAdmin(event: H3Event): Promise<boolean> {
  if (!adminConfigured()) return false
  // Read-only check: unseal the cookie the request carries. useSession() would
  // mint and send a fresh sealed cookie to every anonymous caller (even one
  // sending a junk cookie); only a successful login may issue one.
  const sealed = getCookie(event, 'cf-admin')
  if (!sealed) return false
  try {
    const session = await unsealSession(event, sessionOptions(), sealed) as { data?: AdminSession }
    return session.data?.admin === true
  }
  catch {
    return false
  }
}

export async function requireAdmin(event: H3Event) {
  if (!(await isAdmin(event))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

export function passwordMatches(supplied: string): boolean {
  const { adminPassword } = useRuntimeConfig()
  if (!adminPassword || !supplied) return false
  // Hash both sides so lengths match for a constant-time comparison.
  const digest = (s: string) => createHash('sha256').update(s).digest()
  return timingSafeEqual(digest(supplied), digest(adminPassword))
}
