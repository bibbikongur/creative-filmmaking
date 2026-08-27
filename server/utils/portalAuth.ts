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

/** Does the user administer the company that owns `jobId` (company active)? */
export function userIsJobAdmin(userId: string, jobId: string): boolean {
  return Boolean(getDb().prepare(`
    SELECT 1 FROM jobs j
    JOIN company_admins ca ON ca.company_id = j.company_id AND ca.user_id = ?
    JOIN companies c ON c.id = j.company_id AND c.status = 'active'
    WHERE j.id = ?
  `).get(userId, jobId))
}

/**
 * May the user link tool documents (location maps, albums, recce plans) to this
 * job? True for a company admin of the job's company or an active job member.
 */
export function userCanAccessJob(userId: string, jobId: string): boolean {
  if (userIsJobAdmin(userId, jobId)) return true
  return Boolean(getDb().prepare(`
    SELECT 1 FROM job_members m
    JOIN jobs j ON j.id = m.job_id
    JOIN companies c ON c.id = j.company_id AND c.status = 'active'
    WHERE m.job_id = ? AND m.user_id = ? AND m.status = 'active'
  `).get(jobId, userId))
}

/**
 * Optional job scope for the tools endpoints (?job= query / body.jobId): returns
 * the job id after an access check, or null when absent. Unknown/foreign job →
 * 404 (no existence leaks).
 */
export function requireToolJob(userId: string, raw: unknown): string | null {
  const jobId = typeof raw === 'string' && raw ? raw : null
  if (!jobId) return null
  if (!userCanAccessJob(userId, jobId)) throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  return jobId
}

export interface PoAccessContext {
  user: PortalUserPublic
  /** Full rights (review, pay, cost codes): company admin or the 'approve' role. */
  isJobAdmin: boolean
  /** May log new costs. */
  canLog: boolean
  /** Sees every order on the job (admins plus the read-only 'view' role). */
  viewAll: boolean
  /**
   * Department scope when not viewAll: the departments whose budgets the
   * member may work in (po_dept_access, defaulting to their own department).
   * A null element scopes to department-less orders.
   */
  departmentIds: (string | null)[]
  /** The member's own department — the default on new orders. Null for admins. */
  homeDepartmentId: string | null
}

/**
 * Authorize the signed-in user to use the purchase-order tool on a job. The
 * per-member po_role decides what they may do; NULL falls back to the derived
 * default (department admins log for their department, others have no access).
 * Company admins always have full rights. No access → 404 (no existence leaks).
 */
export async function requirePurchaseOrderAccess(event: H3Event, jobId: string): Promise<PoAccessContext> {
  const user = await requirePortalUser(event)
  const db = getDb()

  const job = db.prepare(`
    SELECT j.company_id FROM jobs j
    JOIN companies c ON c.id = j.company_id AND c.status = 'active'
    WHERE j.id = ?
  `).get(jobId) as { company_id: string } | undefined
  if (!job) throw createError({ statusCode: 404, statusMessage: 'Job not found' })

  const isCompanyAdmin = Boolean(db.prepare(
    'SELECT 1 FROM company_admins WHERE company_id = ? AND user_id = ?',
  ).get(job.company_id, user.id))
  if (isCompanyAdmin) return { user, isJobAdmin: true, canLog: true, viewAll: true, departmentIds: [], homeDepartmentId: null }

  const member = db.prepare(`
    SELECT department_id, is_dept_admin, po_role, po_dept_access FROM job_members
    WHERE job_id = ? AND user_id = ? AND status = 'active'
  `).get(jobId, user.id) as {
    department_id: string | null
    is_dept_admin: number
    po_role: string | null
    po_dept_access: string | null
  } | undefined
  if (!member) throw createError({ statusCode: 404, statusMessage: 'Job not found' })

  // Department scope for the log role: the granted list, or just their own.
  let departmentIds: (string | null)[] = [member.department_id]
  if (member.po_dept_access) {
    try {
      const parsed = JSON.parse(member.po_dept_access)
      if (Array.isArray(parsed)) {
        const ids = parsed.filter((d): d is string => typeof d === 'string')
        if (ids.length) departmentIds = ids
      }
    }
    catch { /* unreadable → default scope */ }
  }

  const role = member.po_role
    ?? (member.is_dept_admin && member.department_id ? 'log' : 'none')
  switch (role) {
    case 'approve':
      return { user, isJobAdmin: true, canLog: true, viewAll: true, departmentIds: [], homeDepartmentId: member.department_id }
    case 'log_all':
      // Logs costs on any department and sees everything, but cannot review.
      return { user, isJobAdmin: false, canLog: true, viewAll: true, departmentIds: [], homeDepartmentId: member.department_id }
    case 'view':
      return { user, isJobAdmin: false, canLog: false, viewAll: true, departmentIds: [], homeDepartmentId: member.department_id }
    case 'log':
      return { user, isJobAdmin: false, canLog: true, viewAll: false, departmentIds, homeDepartmentId: member.department_id }
    default:
      throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }
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
