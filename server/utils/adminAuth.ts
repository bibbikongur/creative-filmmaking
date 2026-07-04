import { createHash, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

// ─────────────────────────────────────────────────────────────────────────────
// Single-password admin auth. NUXT_ADMIN_PASSWORD unlocks the panel; the
// session lives in a sealed (encrypted) cookie whose key is derived from the
// same password, so no separate session secret needs configuring and sessions
// survive server restarts. Changing the password invalidates all sessions.
// ─────────────────────────────────────────────────────────────────────────────

type AdminSession = { admin?: boolean }

export const adminConfigured = () => Boolean(useRuntimeConfig().adminPassword)

const sessionOptions = () => {
  const { adminPassword } = useRuntimeConfig()
  if (!adminPassword) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Admin panel is not configured — set the NUXT_ADMIN_PASSWORD environment variable.',
    })
  }
  return {
    name: 'cf-admin',
    password: createHash('sha256').update(`cf-admin-session:${adminPassword}`).digest('hex'),
    maxAge: 60 * 60 * 24 * 7, // 7 days
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
  try {
    const session = await getAdminSession(event)
    return session.data.admin === true
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
