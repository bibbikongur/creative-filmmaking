import type { Job, JobMember, JobMemberStatus, JobStatus, LocaleCode, PortalUserStatus } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Jobs (productions) and their members. Day rates are stored encrypted
// (AES-256-GCM) and only decrypted here, for company admins and the payroll
// endpoints. All lookups are scoped by company via portalAuth guards.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_DAY_RATE = 10_000_000

export function parseDayRate(value: unknown): number {
  const rate = Number(value)
  if (!Number.isFinite(rate) || rate <= 0 || rate > MAX_DAY_RATE || !Number.isInteger(rate)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: ['Day rate must be a whole ISK amount above 0.'] },
    })
  }
  return rate
}

export function rowToJob(r: Record<string, unknown>): Job {
  return {
    id: r.id as string,
    companyId: r.company_id as string,
    createdAt: r.created_at as string,
    name: r.name as string,
    status: r.status as JobStatus,
  }
}

export function createJob(companyId: string, name: string): Job {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 120) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: ['Job name is required (max 120 characters).'] },
    })
  }
  const id = newPortalId('j')
  getDb().prepare('INSERT INTO jobs (id, company_id, created_at, name, status) VALUES (?, ?, ?, ?, \'active\')')
    .run(id, companyId, new Date().toISOString(), trimmed)
  return getJob(id)!
}

export function getJob(id: string): Job | null {
  const row = getDb().prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? rowToJob(row) : null
}

export function listJobs(companyIds: string[]): (Job & { memberCount: number, pendingWeeks: number })[] {
  if (!companyIds.length) return []
  const placeholders = companyIds.map(() => '?').join(', ')
  const rows = getDb().prepare(`
    SELECT j.*,
      (SELECT COUNT(*) FROM job_members m WHERE m.job_id = j.id AND m.status = 'active') AS member_count,
      (SELECT COUNT(*) FROM timesheet_weeks w WHERE w.job_id = j.id AND w.status IN ('submitted', 'dept_approved', 'altered')) AS pending_weeks
    FROM jobs j WHERE j.company_id IN (${placeholders})
    ORDER BY j.status, j.created_at DESC
  `).all(...companyIds) as Record<string, unknown>[]
  return rows.map(r => ({
    ...rowToJob(r),
    memberCount: (r.member_count as number) ?? 0,
    pendingWeeks: (r.pending_weeks as number) ?? 0,
  }))
}

export function updateJob(id: string, input: { name?: string, status?: JobStatus }): boolean {
  const db = getDb()
  if (!db.prepare('SELECT id FROM jobs WHERE id = ?').get(id)) return false
  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name || name.length > 120) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: ['Job name is required (max 120 characters).'] },
      })
    }
    db.prepare('UPDATE jobs SET name = ? WHERE id = ?').run(name, id)
  }
  if (input.status !== undefined) {
    db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run(input.status, id)
  }
  return true
}

export function listMembers(jobId: string): JobMember[] {
  const rows = getDb().prepare(`
    SELECT m.status AS member_status, m.day_rate_enc, m.department_id, m.is_dept_admin,
      d.name AS department_name,
      u.id AS user_id, u.email, u.name, u.status AS user_status, u.locale
    FROM job_members m
    JOIN portal_users u ON u.id = m.user_id
    LEFT JOIN departments d ON d.id = m.department_id
    WHERE m.job_id = ?
    ORDER BY m.status, u.name COLLATE NOCASE, u.email
  `).all(jobId) as Record<string, unknown>[]
  return rows.map(r => ({
    userId: r.user_id as string,
    email: r.email as string,
    name: (r.name as string | null) ?? undefined,
    userStatus: r.user_status as PortalUserStatus,
    memberStatus: r.member_status as JobMemberStatus,
    locale: r.locale as LocaleCode,
    dayRate: Number(decryptField(r.day_rate_enc as string)),
    departmentId: (r.department_id as string | null) ?? undefined,
    departmentName: (r.department_name as string | null) ?? undefined,
    isDeptAdmin: Boolean(r.is_dept_admin),
  }))
}

/** The active member's department id for a job, or null (unassigned / not a member). */
export function memberDepartmentId(jobId: string, userId: string): string | null {
  const row = getDb().prepare(`
    SELECT department_id FROM job_members WHERE job_id = ? AND user_id = ? AND status = 'active'
  `).get(jobId, userId) as { department_id: string | null } | undefined
  return row?.department_id ?? null
}

/** The member's department name for display, or null. */
export function departmentNameForMember(jobId: string, userId: string): string | null {
  const row = getDb().prepare(`
    SELECT d.name FROM job_members m JOIN departments d ON d.id = m.department_id
    WHERE m.job_id = ? AND m.user_id = ?
  `).get(jobId, userId) as { name: string } | undefined
  return row?.name ?? null
}

/** The member's decrypted day rate, or null when not an active member. */
export function getMemberDayRate(jobId: string, userId: string): number | null {
  const row = getDb().prepare(`
    SELECT day_rate_enc FROM job_members WHERE job_id = ? AND user_id = ? AND status = 'active'
  `).get(jobId, userId) as { day_rate_enc: string } | undefined
  return row ? Number(decryptField(row.day_rate_enc)) : null
}

/**
 * Add someone to a job by email. Existing active accounts are simply attached
 * (caller sends an added-to-job notice); otherwise an invite token is issued
 * (caller sends the set-your-password invite).
 */
export function addMember(jobId: string, input: {
  email: string
  name?: string
  dayRate: number
  locale: LocaleCode
  departmentId?: string | null
  isDeptAdmin?: boolean
}): { member: JobMember, inviteToken: string | null } {
  const db = getDb()
  if (!isValidEmail(input.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: ['A valid email address is required.'] },
    })
  }
  const rateEnc = encryptField(String(parseDayRate(input.dayRate)))
  const department = resolveDepartment(jobId, input.departmentId)
  // A department admin must belong to a department.
  const deptAdmin = input.isDeptAdmin && department ? 1 : 0

  let inviteToken: string | null = null
  let userId = ''
  db.transaction(() => {
    const { user, inviteToken: token } = ensureUserForInvite(input.email, { name: input.name, locale: input.locale })
    userId = user.id
    inviteToken = token
    const existing = db.prepare('SELECT id, status FROM job_members WHERE job_id = ? AND user_id = ?')
      .get(jobId, user.id) as { id: number, status: string } | undefined
    if (existing) {
      // Re-adding someone who was removed re-activates them with the new details.
      db.prepare('UPDATE job_members SET status = \'active\', day_rate_enc = ?, department_id = ?, is_dept_admin = ? WHERE id = ?')
        .run(rateEnc, department, deptAdmin, existing.id)
    }
    else {
      db.prepare(`
        INSERT INTO job_members (job_id, user_id, created_at, status, day_rate_enc, department_id, is_dept_admin)
        VALUES (?, ?, ?, 'active', ?, ?, ?)
      `).run(jobId, user.id, new Date().toISOString(), rateEnc, department, deptAdmin)
    }
  })()

  const member = listMembers(jobId).find(m => m.userId === userId)!
  return { member, inviteToken }
}

export function updateMember(jobId: string, userId: string, input: {
  dayRate?: number
  status?: JobMemberStatus
  departmentId?: string | null
  isDeptAdmin?: boolean
}): boolean {
  const db = getDb()
  const existing = db.prepare('SELECT id, department_id, is_dept_admin FROM job_members WHERE job_id = ? AND user_id = ?')
    .get(jobId, userId) as { id: number, department_id: string | null, is_dept_admin: number } | undefined
  if (!existing) return false

  if (input.dayRate !== undefined) {
    db.prepare('UPDATE job_members SET day_rate_enc = ? WHERE job_id = ? AND user_id = ?')
      .run(encryptField(String(parseDayRate(input.dayRate))), jobId, userId)
  }
  if (input.status !== undefined) {
    db.prepare('UPDATE job_members SET status = ? WHERE job_id = ? AND user_id = ?')
      .run(input.status, jobId, userId)
  }
  // department_id and is_dept_admin resolve together: an admin flag only sticks
  // when the member ends up in a department.
  if (input.departmentId !== undefined || input.isDeptAdmin !== undefined) {
    const department = input.departmentId !== undefined
      ? resolveDepartment(jobId, input.departmentId)
      : existing.department_id
    const wantAdmin = input.isDeptAdmin !== undefined ? input.isDeptAdmin : Boolean(existing.is_dept_admin)
    const deptAdmin = wantAdmin && department ? 1 : 0
    db.prepare('UPDATE job_members SET department_id = ?, is_dept_admin = ? WHERE job_id = ? AND user_id = ?')
      .run(department, deptAdmin, jobId, userId)
  }
  return true
}

/** Validate an incoming department id against the job; null clears the department. */
function resolveDepartment(jobId: string, departmentId?: string | null): string | null {
  if (!departmentId) return null
  if (!departmentBelongsToJob(departmentId, jobId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid department for this job.' })
  }
  return departmentId
}
