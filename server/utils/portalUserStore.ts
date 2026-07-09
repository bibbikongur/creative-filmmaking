import { randomBytes } from 'node:crypto'
import type { JobStatus, LocaleCode, PortalMemberships, PortalUserPublic, PortalUserStatus } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Portal accounts — one global account per email, usable across companies and
// jobs. Credentials never leave this module except through getCredentials()
// (login only). Invite / password-reset tokens are stored hashed.
// ─────────────────────────────────────────────────────────────────────────────

export const newPortalId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${randomBytes(3).toString('hex')}`

export function rowToPortalUser(r: Record<string, unknown>): PortalUserPublic {
  return {
    id: r.id as string,
    email: r.email as string,
    name: (r.name as string | null) ?? undefined,
    status: r.status as PortalUserStatus,
    locale: r.locale as LocaleCode,
  }
}

export function getUserById(id: string): PortalUserPublic | null {
  const row = getDb().prepare('SELECT * FROM portal_users WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? rowToPortalUser(row) : null
}

export function getUserByEmail(email: string): PortalUserPublic | null {
  const row = getDb().prepare('SELECT * FROM portal_users WHERE email = ? COLLATE NOCASE')
    .get(email.trim()) as Record<string, unknown> | undefined
  return row ? rowToPortalUser(row) : null
}

/** Login only — the one place password hashes are read. */
export function getCredentials(email: string): { id: string, status: PortalUserStatus, passwordHash: string | null } | null {
  const row = getDb().prepare('SELECT id, status, password_hash FROM portal_users WHERE email = ? COLLATE NOCASE')
    .get(email.trim()) as Record<string, unknown> | undefined
  if (!row) return null
  return {
    id: row.id as string,
    status: row.status as PortalUserStatus,
    passwordHash: (row.password_hash as string | null) ?? null,
  }
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200

/**
 * Find or create the account behind an invitation (company admin or job
 * member). Existing active accounts are reused untouched; new or still-invited
 * accounts get a fresh invite token. Returns the raw token when an invite
 * email should be sent, null when the account is already active.
 */
export function ensureUserForInvite(email: string, opts: { name?: string, locale: LocaleCode }): {
  user: PortalUserPublic
  inviteToken: string | null
} {
  const db = getDb()
  const existing = getUserByEmail(email)

  if (existing) {
    if (existing.status === 'active') return { user: existing, inviteToken: null }
    // invited (never activated) or disabled → re-issue the invite
    const { token, tokenHash, expiresAt } = makeToken('invite')
    db.prepare(`
      UPDATE portal_users
      SET status = 'invited', token_hash = ?, token_expires_at = ?, token_purpose = 'invite'
      WHERE id = ?
    `).run(tokenHash, expiresAt, existing.id)
    return { user: getUserById(existing.id)!, inviteToken: token }
  }

  const id = newPortalId('u')
  const { token, tokenHash, expiresAt } = makeToken('invite')
  db.prepare(`
    INSERT INTO portal_users (id, created_at, email, name, status, locale, token_hash, token_expires_at, token_purpose)
    VALUES (?, ?, ?, ?, 'invited', ?, ?, ?, 'invite')
  `).run(id, new Date().toISOString(), normalizeEmail(email), opts.name?.trim() || null, opts.locale, tokenHash, expiresAt)
  return { user: getUserById(id)!, inviteToken: token }
}

/** Re-issue an invite token for a not-yet-active user. */
export function reissueInvite(userId: string): string | null {
  const user = getUserById(userId)
  if (!user || user.status === 'active') return null
  const { token, tokenHash, expiresAt } = makeToken('invite')
  getDb().prepare(`
    UPDATE portal_users
    SET status = 'invited', token_hash = ?, token_expires_at = ?, token_purpose = 'invite'
    WHERE id = ?
  `).run(tokenHash, expiresAt, userId)
  return token
}

export function findByToken(rawToken: string, purpose: 'invite' | 'reset'): PortalUserPublic | null {
  if (!rawToken || rawToken.length > 200) return null
  const row = getDb().prepare(`
    SELECT * FROM portal_users
    WHERE token_hash = ? AND token_purpose = ? AND token_expires_at > ?
  `).get(hashToken(rawToken), purpose, new Date().toISOString()) as Record<string, unknown> | undefined
  return row ? rowToPortalUser(row) : null
}

export function acceptInvite(rawToken: string, input: { password: string, name?: string }): PortalUserPublic | null {
  const user = findByToken(rawToken, 'invite')
  if (!user) return null
  getDb().prepare(`
    UPDATE portal_users
    SET status = 'active', password_hash = ?, name = COALESCE(?, name),
        token_hash = NULL, token_expires_at = NULL, token_purpose = NULL
    WHERE id = ?
  `).run(hashPassword(input.password), input.name?.trim() || null, user.id)
  return getUserById(user.id)
}

/** Returns the raw reset token, or null when no active account matches (caller responds 200 either way). */
export function startPasswordReset(email: string): { user: PortalUserPublic, token: string } | null {
  const user = getUserByEmail(email)
  if (!user || user.status !== 'active') return null
  const { token, tokenHash, expiresAt } = makeToken('reset')
  getDb().prepare(`
    UPDATE portal_users SET token_hash = ?, token_expires_at = ?, token_purpose = 'reset' WHERE id = ?
  `).run(tokenHash, expiresAt, user.id)
  return { user, token }
}

export function resetPassword(rawToken: string, password: string): PortalUserPublic | null {
  const user = findByToken(rawToken, 'reset')
  if (!user) return null
  getDb().prepare(`
    UPDATE portal_users
    SET password_hash = ?, token_hash = NULL, token_expires_at = NULL, token_purpose = NULL
    WHERE id = ?
  `).run(hashPassword(password), user.id)
  return getUserById(user.id)
}

export function setUserLocale(userId: string, locale: LocaleCode) {
  getDb().prepare('UPDATE portal_users SET locale = ? WHERE id = ?').run(locale, userId)
}

/** Everything the signed-in user can see — drives the portal nav and job picker. */
export function membershipsForUser(userId: string): PortalMemberships {
  const db = getDb()
  const adminCompanies = (db.prepare(`
    SELECT c.id, c.name FROM company_admins ca
    JOIN companies c ON c.id = ca.company_id
    WHERE ca.user_id = ? AND c.status = 'active'
    ORDER BY c.name
  `).all(userId) as Record<string, unknown>[])
    .map(r => ({ id: r.id as string, name: r.name as string }))

  const jobs = (db.prepare(`
    SELECT j.id AS job_id, j.name AS job_name, j.status AS job_status, c.name AS company_name
    FROM job_members m
    JOIN jobs j ON j.id = m.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE m.user_id = ? AND m.status = 'active' AND c.status = 'active'
    ORDER BY j.status, j.created_at DESC
  `).all(userId) as Record<string, unknown>[])
    .map(r => ({
      jobId: r.job_id as string,
      jobName: r.job_name as string,
      companyName: r.company_name as string,
      status: r.job_status as JobStatus,
    }))

  const deptAdmin = (db.prepare(`
    SELECT j.id AS job_id, j.name AS job_name, d.id AS department_id, d.name AS department_name
    FROM job_members m
    JOIN departments d ON d.id = m.department_id
    JOIN jobs j ON j.id = m.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE m.user_id = ? AND m.is_dept_admin = 1 AND m.status = 'active'
      AND j.status = 'active' AND c.status = 'active'
    ORDER BY j.created_at DESC, d.name
  `).all(userId) as Record<string, unknown>[])
    .map(r => ({
      jobId: r.job_id as string,
      jobName: r.job_name as string,
      departmentId: r.department_id as string,
      departmentName: r.department_name as string,
    }))

  return { adminCompanies, jobs, deptAdmin }
}
