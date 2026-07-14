import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import type { PortalUserPublic, TimesheetWeek, WeekReviewCapabilities } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Portal sessions — real per-user accounts (company admins + employees), unlike
// the owner's single-password /admin session. The sealed cookie only stores the
// user id; the user row is re-read on every request so disabling an account or
// its company locks it out immediately.
// ─────────────────────────────────────────────────────────────────────────────

type PortalSession = { uid?: string, epoch?: number }

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
    if (!user || user.status !== 'active') return null
    // Reject cookies issued before the last credential change. Cookies predating
    // this feature carry no epoch (→ 0), matching the default epoch of accounts
    // that never reset, so existing sessions survive the rollout.
    const epoch = getUserEpoch(user.id) ?? 0
    if ((session.data.epoch ?? 0) !== epoch) return null
    return user
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

export interface WeekReviewContext {
  user: PortalUserPublic
  week: TimesheetWeek
  companyId: string
  isJobAdmin: boolean
  /** The user is a department admin of the submitter's department (and not the submitter). */
  isDeptApprover: boolean
  /** The submitter's department has an approver other than themselves → a dept stage exists. */
  hasDeptStage: boolean
}

/**
 * Authorize the signed-in user to review a specific week. A user qualifies if
 * they administer the week's job's company (job admin) or admin the submitter's
 * department (dept approver, and not the submitter). Anyone else → 404.
 */
export async function requireWeekReviewer(event: H3Event, weekId: number): Promise<WeekReviewContext> {
  const week = Number.isInteger(weekId) ? getWeekById(weekId) : null
  if (!week) throw createError({ statusCode: 404, statusMessage: 'Timesheet not found' })
  const user = await requirePortalUser(event)

  const companyRow = getDb().prepare(`
    SELECT j.company_id FROM jobs j
    JOIN companies c ON c.id = j.company_id AND c.status = 'active'
    WHERE j.id = ?
  `).get(week.jobId) as { company_id: string } | undefined
  if (!companyRow) throw createError({ statusCode: 404, statusMessage: 'Timesheet not found' })
  const companyId = companyRow.company_id

  const isJobAdmin = Boolean(getDb().prepare(
    'SELECT 1 FROM company_admins WHERE company_id = ? AND user_id = ?',
  ).get(companyId, user.id))

  const submitterDeptId = memberDepartmentId(week.jobId, week.userId)
  const deptAdmins = submitterDeptId ? deptAdminsFor(submitterDeptId) : []
  const isDeptApprover = Boolean(submitterDeptId) && deptAdmins.includes(user.id) && user.id !== week.userId
  const hasDeptStage = deptAdmins.some(id => id !== week.userId)

  if (!isJobAdmin && !isDeptApprover) throw createError({ statusCode: 404, statusMessage: 'Timesheet not found' })
  return { user, week, companyId, isJobAdmin, isDeptApprover, hasDeptStage }
}

/** What the reviewer may do to the week in its current state — drives the UI + endpoint guards. */
export function weekCapabilities(ctx: WeekReviewContext): WeekReviewCapabilities {
  const { week, isJobAdmin, isDeptApprover, hasDeptStage } = ctx
  const s = week.status
  return {
    canDeptApprove: isDeptApprover && s === 'submitted',
    canJobApprove: isJobAdmin && (s === 'dept_approved' || (s === 'submitted' && !hasDeptStage)),
    canAlter: (isDeptApprover && s === 'submitted') || (isJobAdmin && (s === 'submitted' || s === 'dept_approved')),
    canReopen: (isDeptApprover && s === 'submitted') || (isJobAdmin && (s === 'submitted' || s === 'dept_approved' || s === 'altered')),
  }
}
