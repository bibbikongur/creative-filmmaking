import type { CompanyStatus, CompanySummary, LocaleCode, PortalUserStatus } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Production companies — created from the owner's admin panel. The owner only
// manages the accounts; timesheet data stays between each company and its
// employees (nothing here reads weeks or entries beyond counts).
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateCompanyInput {
  name: string
  adminEmail: string
  adminName?: string
  locale: LocaleCode
}

export function parseCompanyPayload(body: unknown): CreateCompanyInput {
  const b = (body ?? {}) as Record<string, unknown>
  const errors: string[] = []
  const name = String(b.name ?? '').trim()
  const adminEmail = String(b.adminEmail ?? '').trim()
  const adminName = String(b.adminName ?? '').trim()
  const locale = b.locale === 'is' ? 'is' : 'en'

  if (!name || name.length > 120) errors.push('Company name is required (max 120 characters).')
  if (!isValidEmail(adminEmail)) errors.push('A valid admin email address is required.')
  if (adminName.length > 120) errors.push('Admin name is too long.')

  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors } })
  }
  return { name, adminEmail, adminName: adminName || undefined, locale }
}

/** Create the company and attach its admin account. Returns the raw invite token when a new invite must be emailed. */
export function createCompany(input: CreateCompanyInput): {
  company: CompanySummary
  adminUserId: string
  inviteToken: string | null
} {
  const db = getDb()
  const id = newPortalId('c')
  let adminUserId = ''
  let inviteToken: string | null = null

  db.transaction(() => {
    db.prepare('INSERT INTO companies (id, created_at, name, status) VALUES (?, ?, ?, \'active\')')
      .run(id, new Date().toISOString(), input.name)
    const { user, inviteToken: token } = ensureUserForInvite(input.adminEmail, {
      name: input.adminName,
      locale: input.locale,
    })
    adminUserId = user.id
    inviteToken = token
    db.prepare('INSERT OR IGNORE INTO company_admins (company_id, user_id) VALUES (?, ?)')
      .run(id, user.id)
  })()

  return { company: getCompanySummary(id)!, adminUserId, inviteToken }
}

export function getCompanySummary(id: string): CompanySummary | null {
  const row = getDb().prepare(`
    SELECT c.*,
      (SELECT u.email FROM company_admins ca JOIN portal_users u ON u.id = ca.user_id
       WHERE ca.company_id = c.id ORDER BY u.created_at LIMIT 1) AS admin_email,
      (SELECT u.status FROM company_admins ca JOIN portal_users u ON u.id = ca.user_id
       WHERE ca.company_id = c.id ORDER BY u.created_at LIMIT 1) AS admin_status,
      (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id) AS job_count,
      (SELECT COUNT(DISTINCT m.user_id) FROM job_members m
       JOIN jobs j ON j.id = m.job_id WHERE j.company_id = c.id AND m.status = 'active') AS employee_count
    FROM companies c WHERE c.id = ?
  `).get(id) as Record<string, unknown> | undefined
  return row ? rowToCompanySummary(row) : null
}

export function listCompanies(): CompanySummary[] {
  const rows = getDb().prepare(`
    SELECT c.*,
      (SELECT u.email FROM company_admins ca JOIN portal_users u ON u.id = ca.user_id
       WHERE ca.company_id = c.id ORDER BY u.created_at LIMIT 1) AS admin_email,
      (SELECT u.status FROM company_admins ca JOIN portal_users u ON u.id = ca.user_id
       WHERE ca.company_id = c.id ORDER BY u.created_at LIMIT 1) AS admin_status,
      (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id) AS job_count,
      (SELECT COUNT(DISTINCT m.user_id) FROM job_members m
       JOIN jobs j ON j.id = m.job_id WHERE j.company_id = c.id AND m.status = 'active') AS employee_count
    FROM companies c ORDER BY c.created_at DESC
  `).all() as Record<string, unknown>[]
  return rows.map(rowToCompanySummary)
}

export function updateCompany(id: string, input: { name?: string, status?: CompanyStatus }): boolean {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM companies WHERE id = ?').get(id)
  if (!existing) return false
  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name || name.length > 120) {
      throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors: ['Company name is required (max 120 characters).'] } })
    }
    db.prepare('UPDATE companies SET name = ? WHERE id = ?').run(name, id)
  }
  if (input.status !== undefined) {
    db.prepare('UPDATE companies SET status = ? WHERE id = ?').run(input.status, id)
  }
  return true
}

export function deleteCompany(id: string): boolean {
  return getDb().prepare('DELETE FROM companies WHERE id = ?').run(id).changes > 0
}

/** Regenerate the company admin's invite. Returns null when the admin already activated. */
export function reinviteCompanyAdmin(companyId: string): { email: string, name?: string, locale: LocaleCode, token: string } | null {
  const row = getDb().prepare(`
    SELECT u.* FROM company_admins ca JOIN portal_users u ON u.id = ca.user_id
    WHERE ca.company_id = ? ORDER BY u.created_at LIMIT 1
  `).get(companyId) as Record<string, unknown> | undefined
  if (!row) return null
  const user = rowToPortalUser(row)
  const token = reissueInvite(user.id)
  if (!token) return null
  return { email: user.email, name: user.name, locale: user.locale, token }
}

function rowToCompanySummary(r: Record<string, unknown>): CompanySummary {
  return {
    id: r.id as string,
    createdAt: r.created_at as string,
    name: r.name as string,
    status: r.status as CompanyStatus,
    adminEmail: (r.admin_email as string | null) ?? undefined,
    adminStatus: (r.admin_status as PortalUserStatus | null) ?? undefined,
    jobCount: (r.job_count as number) ?? 0,
    employeeCount: (r.employee_count as number) ?? 0,
  }
}
