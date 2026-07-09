import type { TimeEntry, TimesheetWeek, WeekEvent, WeekEventType, WeekPayroll, WeekStatus } from '~~/app/types'
import type { PayrollShift } from './payroll'

// ─────────────────────────────────────────────────────────────────────────────
// Timesheet weeks and their entries. Two-stage approval (all transitions run in
// one transaction with their audit event; illegal transitions → 409):
//
//   draft ─submit─> submitted ─deptApprove─> dept_approved ─jobApprove─> approved
//                       │  └─(no dept stage)─ jobApprove ───────────────> approved
//                       ├─alter(dept)─> altered[→dept_approved] ─confirm─> dept_approved …
//                       └─alter(job) ─> altered[→approved]      ─confirm─> approved
//   dept_approved ─alter(job)─> altered[→approved] ─confirm─> approved
//   any review state ─reopen─> draft
//
// Weeks are Monday-based ISO dates. Entries: a shift belongs to its start
// date; end_min > 1440 means it runs past midnight.
// ─────────────────────────────────────────────────────────────────────────────

/** How far back shifts are fetched to seed rest gaps and the 7-day streak. */
const LOOKBACK_DAYS = 21

export interface EntryInput {
  date: string
  startMin: number
  endMin: number
  note?: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const isIsoDate = (s: string) => DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`))

export const isMonday = (s: string) => isIsoDate(s) && new Date(`${s}T00:00:00Z`).getUTCDay() === 1

export const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// ── Weeks ────────────────────────────────────────────────────────────────────

export function rowToWeek(r: Record<string, unknown>): TimesheetWeek {
  return {
    id: r.id as number,
    jobId: r.job_id as string,
    userId: r.user_id as string,
    weekStart: r.week_start as string,
    status: r.status as WeekStatus,
    submittedAt: (r.submitted_at as string | null) ?? undefined,
    deptApprovedAt: (r.dept_approved_at as string | null) ?? undefined,
    approvedAt: (r.approved_at as string | null) ?? undefined,
    alteredTarget: (r.altered_target as 'dept_approved' | 'approved' | null) ?? undefined,
  }
}

export function getWeekById(id: number): TimesheetWeek | null {
  const row = getDb().prepare('SELECT * FROM timesheet_weeks WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? rowToWeek(row) : null
}

export function getOrCreateWeek(userId: string, jobId: string, weekStart: string): TimesheetWeek {
  if (!isMonday(weekStart)) {
    throw createError({ statusCode: 400, statusMessage: 'weekStart must be a Monday (YYYY-MM-DD).' })
  }
  const db = getDb()
  const existing = db.prepare('SELECT * FROM timesheet_weeks WHERE user_id = ? AND job_id = ? AND week_start = ?')
    .get(userId, jobId, weekStart) as Record<string, unknown> | undefined
  if (existing) return rowToWeek(existing)
  const result = db.prepare(`
    INSERT INTO timesheet_weeks (job_id, user_id, week_start, status) VALUES (?, ?, ?, 'draft')
  `).run(jobId, userId, weekStart)
  return getWeekById(Number(result.lastInsertRowid))!
}

export function listWeeksForUser(userId: string, jobId: string, from: string, to: string): TimesheetWeek[] {
  return (getDb().prepare(`
    SELECT * FROM timesheet_weeks
    WHERE user_id = ? AND job_id = ? AND week_start >= ? AND week_start <= ?
    ORDER BY week_start DESC
  `).all(userId, jobId, from, to) as Record<string, unknown>[]).map(rowToWeek)
}

export interface WeekListRow extends TimesheetWeek {
  userName?: string
  userEmail: string
  jobName: string
  departmentName?: string
  totalMinutes: number
}

const SELECT_WEEK_ROW = `
  SELECT w.*, u.name AS user_name, u.email AS user_email, j.name AS job_name,
    d.name AS department_name,
    (SELECT COALESCE(SUM(e.end_min - e.start_min), 0) FROM time_entries e WHERE e.week_id = w.id) AS total_minutes
  FROM timesheet_weeks w
  JOIN jobs j ON j.id = w.job_id
  JOIN portal_users u ON u.id = w.user_id
  LEFT JOIN job_members m ON m.job_id = w.job_id AND m.user_id = w.user_id
  LEFT JOIN departments d ON d.id = m.department_id
`
const WEEK_ORDER = `
  ORDER BY CASE w.status
             WHEN 'submitted' THEN 0 WHEN 'dept_approved' THEN 1 WHEN 'altered' THEN 2
             WHEN 'draft' THEN 3 ELSE 4 END,
           w.week_start DESC
`

function mapWeekRow(r: Record<string, unknown>): WeekListRow {
  return {
    ...rowToWeek(r),
    userName: (r.user_name as string | null) ?? undefined,
    userEmail: r.user_email as string,
    jobName: r.job_name as string,
    departmentName: (r.department_name as string | null) ?? undefined,
    totalMinutes: (r.total_minutes as number) ?? 0,
  }
}

/** Weeks a company admin can review — scoped to their companies (used by stats too). */
export function listWeeksForCompanies(companyIds: string[], filters: { jobId?: string, status?: WeekStatus, userId?: string, departmentId?: string } = {}): WeekListRow[] {
  if (!companyIds.length) return []
  const conditions = [`j.company_id IN (${companyIds.map(() => '?').join(', ')})`]
  const params: unknown[] = [...companyIds]
  if (filters.jobId) { conditions.push('w.job_id = ?'); params.push(filters.jobId) }
  if (filters.status) { conditions.push('w.status = ?'); params.push(filters.status) }
  if (filters.userId) { conditions.push('w.user_id = ?'); params.push(filters.userId) }
  if (filters.departmentId) { conditions.push('m.department_id = ?'); params.push(filters.departmentId) }
  const rows = getDb().prepare(`${SELECT_WEEK_ROW} WHERE ${conditions.join(' AND ')} ${WEEK_ORDER}`)
    .all(...params) as Record<string, unknown>[]
  return rows.map(mapWeekRow)
}

/** All weeks of a department's members (for a dept-admin cost view — includes their own). */
export function listWeeksForCompaniesByDepartment(departmentId: string, jobId?: string): WeekListRow[] {
  const conditions = ['m.department_id = ?']
  const params: unknown[] = [departmentId]
  if (jobId) { conditions.push('w.job_id = ?'); params.push(jobId) }
  const rows = getDb().prepare(`${SELECT_WEEK_ROW} WHERE ${conditions.join(' AND ')} ${WEEK_ORDER}`)
    .all(...params) as Record<string, unknown>[]
  return rows.map(mapWeekRow)
}

/**
 * Review queue for the signed-in user: every week in a company they administer,
 * plus (excluding their own) weeks of members in a department they administer.
 * A single WHERE unions both so dual-role users see one deduped list.
 */
export function listReviewableWeeks(
  userId: string,
  companyIds: string[],
  departmentIds: string[],
  filters: { jobId?: string, status?: WeekStatus, departmentId?: string } = {},
): WeekListRow[] {
  if (!companyIds.length && !departmentIds.length) return []
  const scope: string[] = []
  const params: unknown[] = []
  if (companyIds.length) {
    scope.push(`j.company_id IN (${companyIds.map(() => '?').join(', ')})`)
    params.push(...companyIds)
  }
  if (departmentIds.length) {
    scope.push(`(m.department_id IN (${departmentIds.map(() => '?').join(', ')}) AND w.user_id != ?)`)
    params.push(...departmentIds, userId)
  }
  const conditions = [`(${scope.join(' OR ')})`]
  if (filters.jobId) { conditions.push('w.job_id = ?'); params.push(filters.jobId) }
  if (filters.status) { conditions.push('w.status = ?'); params.push(filters.status) }
  if (filters.departmentId) { conditions.push('m.department_id = ?'); params.push(filters.departmentId) }
  const rows = getDb().prepare(`${SELECT_WEEK_ROW} WHERE ${conditions.join(' AND ')} ${WEEK_ORDER}`)
    .all(...params) as Record<string, unknown>[]
  return rows.map(mapWeekRow)
}

// ── Entries ──────────────────────────────────────────────────────────────────

export function rowToEntry(r: Record<string, unknown>): TimeEntry {
  return {
    id: r.id as number,
    date: r.date as string,
    startMin: r.start_min as number,
    endMin: r.end_min as number,
    note: (r.note as string | null) ?? undefined,
  }
}

export function getEntries(weekId: number): TimeEntry[] {
  return (getDb().prepare('SELECT * FROM time_entries WHERE week_id = ? ORDER BY date, start_min').all(weekId) as Record<string, unknown>[])
    .map(rowToEntry)
}

export function parseEntries(body: unknown, weekStart: string): EntryInput[] {
  const raw = Array.isArray((body as Record<string, unknown>)?.entries) ? (body as { entries: unknown[] }).entries : null
  const errors: string[] = []
  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors: ['entries must be an array.'] } })
  }
  if (raw.length > 50) errors.push('Too many entries for one week.')

  const weekEnd = addDays(weekStart, 6)
  const entries: EntryInput[] = []
  for (const item of raw) {
    const e = (item ?? {}) as Record<string, unknown>
    const date = String(e.date ?? '')
    const startMin = Number(e.startMin)
    const endMin = Number(e.endMin)
    const note = String(e.note ?? '').trim()
    if (!isIsoDate(date) || date < weekStart || date > weekEnd) {
      errors.push(`Entry date ${date || '(empty)'} is outside this week.`)
      continue
    }
    if (!Number.isInteger(startMin) || startMin < 0 || startMin >= 1440
      || !Number.isInteger(endMin) || endMin <= startMin || endMin > startMin + 1440) {
      errors.push(`Invalid times on ${date}.`)
      continue
    }
    if (note.length > 500) errors.push(`Note on ${date} is too long.`)
    entries.push({ date, startMin, endMin, note: note || undefined })
  }

  // No overlapping shifts (compare on an absolute timeline).
  const abs = entries
    .map(e => ({
      date: e.date,
      start: Date.parse(`${e.date}T00:00:00Z`) / 60000 + e.startMin,
      end: Date.parse(`${e.date}T00:00:00Z`) / 60000 + e.endMin,
    }))
    .sort((a, b) => a.start - b.start)
  for (let i = 1; i < abs.length; i++) {
    if (abs[i]!.start < abs[i - 1]!.end) {
      errors.push(`Shifts overlap around ${abs[i]!.date}.`)
      break
    }
  }

  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors } })
  }
  return entries
}

function writeEntries(weekId: number, week: TimesheetWeek, entries: EntryInput[]) {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare('DELETE FROM time_entries WHERE week_id = ?').run(weekId)
  const insert = db.prepare(`
    INSERT INTO time_entries (week_id, user_id, job_id, date, start_min, end_min, note, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const e of entries) {
    insert.run(weekId, week.userId, week.jobId, e.date, e.startMin, e.endMin, e.note ?? null, now, now)
  }
}

/** Employee saving their own draft. */
export function replaceEntries(weekId: number, entries: EntryInput[]) {
  const db = getDb()
  const week = getWeekById(weekId)
  if (!week) throw createError({ statusCode: 404, statusMessage: 'Week not found' })
  if (week.status !== 'draft') {
    throw createError({ statusCode: 409, statusMessage: 'This week has been submitted and can no longer be edited.' })
  }
  db.transaction(() => writeEntries(weekId, week, entries))()
}

// ── Status transitions ───────────────────────────────────────────────────────

function addEvent(weekId: number, actorUserId: string, type: WeekEventType, detail?: unknown) {
  getDb().prepare('INSERT INTO week_events (week_id, created_at, actor_user_id, type, detail) VALUES (?, ?, ?, ?, ?)')
    .run(weekId, new Date().toISOString(), actorUserId, type, detail === undefined ? null : JSON.stringify(detail))
}

function assertFrom(week: TimesheetWeek, allowedFrom: WeekStatus[], to: string) {
  if (!allowedFrom.includes(week.status)) {
    throw createError({ statusCode: 409, statusMessage: `Cannot change a ${week.status} week to ${to}.` })
  }
}

export function submitWeek(week: TimesheetWeek, actorUserId: string) {
  const db = getDb()
  db.transaction(() => {
    assertFrom(week, ['draft'], 'submitted')
    db.prepare('UPDATE timesheet_weeks SET status = \'submitted\', submitted_at = ?, altered_target = NULL WHERE id = ?')
      .run(new Date().toISOString(), week.id)
    addEvent(week.id, actorUserId, 'submitted')
  })()
}

/** Department admin's first-stage sign-off — sends the week up to the job admin. */
export function deptApproveWeek(week: TimesheetWeek, actorUserId: string) {
  const db = getDb()
  db.transaction(() => {
    assertFrom(week, ['submitted'], 'dept_approved')
    db.prepare('UPDATE timesheet_weeks SET status = \'dept_approved\', dept_approved_at = ?, dept_approved_by = ? WHERE id = ?')
      .run(new Date().toISOString(), actorUserId, week.id)
    addEvent(week.id, actorUserId, 'approved', { stage: 'dept' })
  })()
}

/** Job admin's final sign-off — from dept_approved, or directly from submitted when there's no dept stage. */
export function approveWeek(week: TimesheetWeek, actorUserId: string, snapshot: WeekPayroll) {
  const db = getDb()
  db.transaction(() => {
    assertFrom(week, ['submitted', 'dept_approved'], 'approved')
    db.prepare('UPDATE timesheet_weeks SET status = \'approved\', approved_at = ?, approved_snapshot = ? WHERE id = ?')
      .run(new Date().toISOString(), JSON.stringify(snapshot), week.id)
    addEvent(week.id, actorUserId, 'approved', { stage: 'job' })
  })()
}

/** Employee accepting a reviewer's alteration — lands at the stage the reviewer edited from. */
export function confirmWeek(week: TimesheetWeek, actorUserId: string, snapshot: WeekPayroll) {
  const db = getDb()
  db.transaction(() => {
    assertFrom(week, ['altered'], 'approved')
    if (week.alteredTarget === 'dept_approved') {
      db.prepare('UPDATE timesheet_weeks SET status = \'dept_approved\', dept_approved_at = ?, dept_approved_by = ?, altered_target = NULL WHERE id = ?')
        .run(new Date().toISOString(), actorUserId, week.id)
    }
    else {
      db.prepare('UPDATE timesheet_weeks SET status = \'approved\', approved_at = ?, approved_snapshot = ?, altered_target = NULL WHERE id = ?')
        .run(new Date().toISOString(), JSON.stringify(snapshot), week.id)
    }
    addEvent(week.id, actorUserId, 'confirmed')
  })()
}

export function reopenWeek(week: TimesheetWeek, actorUserId: string) {
  const db = getDb()
  db.transaction(() => {
    assertFrom(week, ['submitted', 'dept_approved', 'altered'], 'draft')
    db.prepare('UPDATE timesheet_weeks SET status = \'draft\', submitted_at = NULL, dept_approved_at = NULL, dept_approved_by = NULL, altered_target = NULL WHERE id = ?')
      .run(week.id)
    addEvent(week.id, actorUserId, 'reopened')
  })()
}

/**
 * Reviewer editing a week — applies the new entries and records the diff. The
 * target stage (where the employee's confirmation lands) is 'dept_approved' for
 * a department-stage edit, else 'approved'.
 */
export function alterWeek(week: TimesheetWeek, actorUserId: string, entries: EntryInput[], target: 'dept_approved' | 'approved', note?: string) {
  const db = getDb()
  const before = getEntries(week.id)
  db.transaction(() => {
    assertFrom(week, ['submitted', 'dept_approved', 'altered'], 'altered')
    db.prepare('UPDATE timesheet_weeks SET status = \'altered\', altered_target = ? WHERE id = ?').run(target, week.id)
    writeEntries(week.id, week, entries)
    addEvent(week.id, actorUserId, 'altered', {
      note: note || undefined,
      changes: diffEntries(before, entries),
    })
  })()
}

/** Per-date diff of shift times; multi-shift days pair up by position. */
export function diffEntries(before: TimeEntry[], after: EntryInput[]) {
  const key = (e: { startMin: number, endMin: number }) => `${e.startMin}-${e.endMin}`
  const group = <T extends { date: string, startMin: number, endMin: number }>(list: T[]) => {
    const map = new Map<string, T[]>()
    for (const e of [...list].sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin)) {
      map.set(e.date, [...(map.get(e.date) ?? []), e])
    }
    return map
  }
  const b = group(before)
  const a = group(after)
  const dates = [...new Set([...b.keys(), ...a.keys()])].sort()
  const changes: { date: string, before: { startMin: number, endMin: number } | null, after: { startMin: number, endMin: number } | null }[] = []
  for (const date of dates) {
    const bs = b.get(date) ?? []
    const as_ = a.get(date) ?? []
    if (bs.map(key).join(',') === as_.map(key).join(',')) continue
    for (let i = 0; i < Math.max(bs.length, as_.length); i++) {
      const beforeE = bs[i] ? { startMin: bs[i]!.startMin, endMin: bs[i]!.endMin } : null
      const afterE = as_[i] ? { startMin: as_[i]!.startMin, endMin: as_[i]!.endMin } : null
      if (beforeE && afterE && key(beforeE) === key(afterE)) continue
      changes.push({ date, before: beforeE, after: afterE })
    }
  }
  return changes
}

// ── Events & payroll assembly ────────────────────────────────────────────────

export function getWeekEvents(weekId: number): WeekEvent[] {
  const rows = getDb().prepare(`
    SELECT e.*, u.name AS actor_name, u.email AS actor_email
    FROM week_events e LEFT JOIN portal_users u ON u.id = e.actor_user_id
    WHERE e.week_id = ? ORDER BY e.id DESC
  `).all(weekId) as Record<string, unknown>[]
  return rows.map(r => ({
    id: r.id as number,
    createdAt: r.created_at as string,
    actorUserId: r.actor_user_id as string,
    actorName: (r.actor_name as string | null) ?? (r.actor_email as string | null) ?? undefined,
    type: r.type as WeekEventType,
    detail: r.detail ? JSON.parse(r.detail as string) : undefined,
  }))
}

export function getShiftsForUser(userId: string, jobId: string, from: string, to: string): PayrollShift[] {
  return (getDb().prepare(`
    SELECT date, start_min, end_min FROM time_entries
    WHERE user_id = ? AND job_id = ? AND date >= ? AND date <= ?
    ORDER BY date, start_min
  `).all(userId, jobId, from, to) as Record<string, unknown>[])
    .map(r => ({ date: r.date as string, startMin: r.start_min as number, endMin: r.end_min as number }))
}

/**
 * Live payroll for a week: current entries + lookback, at the member's current
 * day rate. Approved weeks should read approved_snapshot instead (see
 * getApprovedSnapshot) so past pay never shifts under a rate change.
 */
export function computeWeekPayroll(week: TimesheetWeek): WeekPayroll | null {
  const dayRate = getMemberDayRate(week.jobId, week.userId)
  if (dayRate === null) return null
  const shifts = getShiftsForUser(week.userId, week.jobId, addDays(week.weekStart, -LOOKBACK_DAYS), addDays(week.weekStart, 6))
  return computePayroll(shifts, dayRate, week.weekStart, addDays(week.weekStart, 6))
}

export function getApprovedSnapshot(weekId: number): WeekPayroll | null {
  const row = getDb().prepare('SELECT approved_snapshot FROM timesheet_weeks WHERE id = ?')
    .get(weekId) as { approved_snapshot: string | null } | undefined
  return row?.approved_snapshot ? JSON.parse(row.approved_snapshot) as WeekPayroll : null
}

/** Snapshot if approved, otherwise live computation. */
export function payrollForWeek(week: TimesheetWeek): WeekPayroll | null {
  return week.status === 'approved' ? getApprovedSnapshot(week.id) : computeWeekPayroll(week)
}
