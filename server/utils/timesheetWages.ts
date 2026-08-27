import type { TimesheetWeek, WeekPayroll } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Approved timesheet weeks flow into the purchase-order budget: every
// department carries an auto-created "Laun" cost code (shared LAUN code for
// members without a department), and the final approval of a week books its
// payroll total as an already-approved wages order on that code. The admin
// then marks it paid through the normal purchase-order flow.
// idx_po_timesheet_week (unique) makes the booking idempotent per week.
// ─────────────────────────────────────────────────────────────────────────────

/** Find or create the wages ("Laun") cost code for a department (null = shared). */
export function ensureWagesCostCode(jobId: string, departmentId: string | null): string {
  const db = getDb()
  const existing = db.prepare(`
    SELECT id FROM po_cost_codes WHERE job_id = ? AND is_wages = 1 AND department_id IS ?
  `).get(jobId, departmentId) as { id: string } | undefined
  if (existing) return existing.id

  let code = 'LAUN'
  let name = 'Laun'
  if (departmentId) {
    const dept = db.prepare('SELECT name FROM departments WHERE id = ?').get(departmentId) as { name: string } | undefined
    name = dept ? `Laun · ${dept.name}` : 'Laun'
    let n = 1
    while (db.prepare('SELECT 1 FROM po_cost_codes WHERE job_id = ? AND code = ?').get(jobId, `LAUN-${n}`)) n++
    code = `LAUN-${n}`
  }
  else if (db.prepare('SELECT 1 FROM po_cost_codes WHERE job_id = ? AND code = ?').get(jobId, code)) {
    // A hand-made LAUN code exists but is not marked is_wages: reuse the number space.
    let n = 0
    while (db.prepare('SELECT 1 FROM po_cost_codes WHERE job_id = ? AND code = ?').get(jobId, `LAUN-${n}`)) n++
    code = `LAUN-${n}`
  }

  const id = newPortalId('cc')
  db.prepare('INSERT INTO po_cost_codes (id, job_id, department_id, created_at, code, name, is_wages) VALUES (?, ?, ?, ?, ?, ?, 1)')
    .run(id, jobId, departmentId, new Date().toISOString(), code, name)
  return id
}

const WEEK_RANGE = (weekStart: string) => `${weekStart} – ${addDays(weekStart, 6)}`

/**
 * Book an approved week's payroll total as a wages purchase order on the
 * member's department budget. Runs inside the approval transaction; a no-op
 * when the total is zero or the week is already booked.
 */
export function bookWeekWages(week: TimesheetWeek, snapshot: WeekPayroll, actorUserId: string) {
  const amount = Math.round(snapshot.totals.amount)
  if (amount <= 0) return
  const db = getDb()
  if (db.prepare('SELECT 1 FROM purchase_orders WHERE timesheet_week_id = ?').get(week.id)) return

  const member = db.prepare('SELECT name, email FROM portal_users WHERE id = ?')
    .get(week.userId) as { name: string | null, email: string } | undefined
  const departmentId = memberDepartmentId(week.jobId, week.userId)
  const costCodeId = ensureWagesCostCode(week.jobId, departmentId)
  const now = new Date().toISOString()

  // Single writer per process (better-sqlite3): MAX+1 cannot interleave here.
  const { n } = db.prepare('SELECT COALESCE(MAX(po_number), 0) + 1 AS n FROM purchase_orders WHERE job_id = ?')
    .get(week.jobId) as { n: number }
  db.prepare(`
    INSERT INTO purchase_orders
      (id, job_id, user_id, department_id, cost_code_id, created_at, po_number,
       vendor, description, amount, status, decided_at, decided_by, timesheet_week_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?)
  `).run(newPortalId('po'), week.jobId, week.userId, departmentId, costCodeId, now, n,
    member?.name || member?.email || 'Laun', `Samþykkt tímaskýrsla · vika ${WEEK_RANGE(week.weekStart)}`,
    amount, now, actorUserId, week.id)
}
