import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import type { PortalUserPublic } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Portal sessions — real per-user accounts (company admins + employees), unlike
// the owner's single-password /admin session. The sealed cookie only stores the
// user id; the user row is re-read on every request so disabling an account or
// its company locks it out immediately.
// ─────────────────────────────────────────────────────────────────────────────

type PortalSession = { uid?: string }

export const portalConfigured = () =>
  Boolean(useRuntimeConfig().sessionSecret) && encryptionConfigured()

const sessionOptions = () => {
  const { sessionSecret } = useRuntimeConfig()
  if (!sessionSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Portal is not configured. Set the NUXT_SESSION_SECRET environment variable.',
    })
  }
  return {
    name: 'cf-portal',
    password: createHash('sha256').update(`cf-portal-session:${sessionSecret}`).digest('hex'),
    maxAge: 60 * 60 * 24 * 14, // 14 days
    cookie: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    },
  }
}

export const getPortalSession = (event: H3Event) =>
  useSession<PortalSession>(event, sessionOptions())

/** Signed-in user or null — never throws for anonymous visitors. */
export async function getPortalUser(event: H3Event): Promise<PortalUserPublic | null> {
  if (!portalConfigured()) return null
  try {
    const session = await getPortalSession(event)
    if (!session.data.uid) return null
    const user = getUserById(session.data.uid)
    return user && user.status === 'active' ? user : null
  }
  catch {
    return null
  }
}

export async function requirePortalUser(event: H3Event): Promise<PortalUserPublic> {
  const user = await getPortalUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return user
}

/** The user must administer `companyId` (and the company must be active). */
export async function requireCompanyAdmin(event: H3Event, companyId: string): Promise<PortalUserPublic> {
  const user = await requirePortalUser(event)
  const row = getDb().prepare(`
    SELECT 1 FROM company_admins ca
    JOIN companies c ON c.id = ca.company_id
    WHERE ca.company_id = ? AND ca.user_id = ? AND c.status = 'active'
  `).get(companyId, user.id)
  if (!row) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  return user
}

/** Companies this user administers (active only). */
export async function requireAnyCompanyAdmin(event: H3Event): Promise<{ user: PortalUserPublic, companyIds: string[] }> {
  const user = await requirePortalUser(event)
  const rows = getDb().prepare(`
    SELECT c.id FROM company_admins ca
    JOIN companies c ON c.id = ca.company_id
    WHERE ca.user_id = ? AND c.status = 'active'
  `).all(user.id) as { id: string }[]
  if (!rows.length) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  return { user, companyIds: rows.map(r => r.id) }
}

/**
 * The user must administer the company that owns `jobId`.
 * Unknown job or a job from another company → 404 (no existence leaks).
 */
export async function requireJobAdmin(event: H3Event, jobId: string): Promise<{ user: PortalUserPublic, companyId: string }> {
  const user = await requirePortalUser(event)
  const row = getDb().prepare(`
    SELECT j.company_id FROM jobs j
    JOIN company_admins ca ON ca.company_id = j.company_id AND ca.user_id = ?
    JOIN companies c ON c.id = j.company_id AND c.status = 'active'
    WHERE j.id = ?
  `).get(user.id, jobId) as { company_id: string } | undefined
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  return { user, companyId: row.company_id }
}

/** The user must be an active member of `jobId` (and job + company active). */
export async function requireJobMember(event: H3Event, jobId: string): Promise<PortalUserPublic> {
  const user = await requirePortalUser(event)
  const row = getDb().prepare(`
    SELECT 1 FROM job_members m
    JOIN jobs j ON j.id = m.job_id
    JOIN companies c ON c.id = j.company_id AND c.status = 'active'
    WHERE m.job_id = ? AND m.user_id = ? AND m.status = 'active'
  `).get(jobId, user.id)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  return user
}
