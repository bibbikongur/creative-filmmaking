import type { Department } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Departments within a job (light, grip, camera, hair & makeup …). A member is
// placed in at most one department per job; a member flagged is_dept_admin
// approves the timesheets of others in the same department before they go up to
// the job admin. Departments are optional — unassigned members go straight to
// the job admin. All lookups here are scoped by the caller via requireJobAdmin.
// ─────────────────────────────────────────────────────────────────────────────

export function rowToDepartment(r: Record<string, unknown>): Department {
  return {
    id: r.id as string,
    jobId: r.job_id as string,
    name: r.name as string,
    memberCount: (r.member_count as number) ?? 0,
  }
}

function validateName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 80) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: ['Department name is required (max 80 characters).'] },
    })
  }
  return trimmed
}

export function createDepartment(jobId: string, name: string): Department {
  const id = newPortalId('d')
  getDb().prepare('INSERT INTO departments (id, job_id, created_at, name) VALUES (?, ?, ?, ?)')
    .run(id, jobId, new Date().toISOString(), validateName(name))
  return getDepartment(id)!
}

export function getDepartment(id: string): Department | null {
  const row = getDb().prepare(`
    SELECT d.*, (SELECT COUNT(*) FROM job_members m WHERE m.department_id = d.id AND m.status = 'active') AS member_count
    FROM departments d WHERE d.id = ?
  `).get(id) as Record<string, unknown> | undefined
  return row ? rowToDepartment(row) : null
}

export function listDepartments(jobId: string): Department[] {
  const rows = getDb().prepare(`
    SELECT d.*, (SELECT COUNT(*) FROM job_members m WHERE m.department_id = d.id AND m.status = 'active') AS member_count
    FROM departments d WHERE d.job_id = ?
    ORDER BY d.name COLLATE NOCASE
  `).all(jobId) as Record<string, unknown>[]
  return rows.map(rowToDepartment)
}

/** Confirm a department belongs to a job (guards cross-job assignment). */
export function departmentBelongsToJob(departmentId: string, jobId: string): boolean {
  return Boolean(getDb().prepare('SELECT 1 FROM departments WHERE id = ? AND job_id = ?').get(departmentId, jobId))
}

export function updateDepartment(jobId: string, departmentId: string, name: string): boolean {
  const db = getDb()
  if (!departmentBelongsToJob(departmentId, jobId)) return false
  db.prepare('UPDATE departments SET name = ? WHERE id = ?').run(validateName(name), departmentId)
  return true
}

export function deleteDepartment(jobId: string, departmentId: string): boolean {
  const db = getDb()
  if (!departmentBelongsToJob(departmentId, jobId)) return false
  db.transaction(() => {
    // Detach members before dropping the department (their timesheets are kept).
    db.prepare('UPDATE job_members SET department_id = NULL, is_dept_admin = 0 WHERE department_id = ?').run(departmentId)
    db.prepare('DELETE FROM departments WHERE id = ?').run(departmentId)
  })()
  return true
}

/** Active department-admin user ids for a department. */
export function deptAdminsFor(departmentId: string): string[] {
  return (getDb().prepare(`
    SELECT user_id FROM job_members WHERE department_id = ? AND is_dept_admin = 1 AND status = 'active'
  `).all(departmentId) as { user_id: string }[]).map(r => r.user_id)
}
