import type { TimeEntry, TimesheetWeek, WeekEvent, WeekEventType, WeekPayroll, WeekStatus } from '~~/app/types'
import type { PayrollShift } from './payroll'

// ─────────────────────────────────────────────────────────────────────────────
// Timesheet weeks and their entries. Status workflow (all transitions run in
// one transaction together with their audit event; illegal transitions → 409):
//
//   draft ──submit──> submitted ──approve──────────────> approved
//                         │
//                         ├──alter──> altered ──confirm──> approved
//                         │              └──alter again──> altered
//                         └──reopen──> draft
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
    approvedAt: (r.approved_at as string | null) ?? undefined,
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
  totalMinutes: number
}

/** Review queue for company admins — scoped to their companies. */
export function listWeeksForCompanies(companyIds: string[], filters: { jobId?: string, status?: WeekStatus, userId?: string } = {}): WeekListRow[] {
  if (!companyIds.length) return []
  const conditions = [`j.company_id IN (${companyIds.map(() => '?').join(', ')})`]
  const params: unknown[] = [...companyIds]
  if (filters.jobId) {
    conditions.push('w.job_id = ?')
    params.push(filters.jobId)
  }
  if (filters.status) {
    conditions.push('w.status = ?')
    params.push(filters.status)
  }
  if (filters.userId) {
    conditions.push('w.user_id = ?')
    params.push(filters.userId)
  }
  const rows = getDb().prepare(`
    SELECT w.*, u.name AS user_name, u.email AS user_email, j.name AS job_name,
      (SELECT COALESCE(SUM(e.end_min - e.start_min), 0) FROM time_entries e WHERE e.week_id = w.id) AS total_minutes
    FROM timesheet_weeks w
    JOIN jobs j ON j.id = w.job_id
    JOIN portal_users u ON u.id = w.user_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY CASE w.status WHEN 'submitted' THEN 0 WHEN 'altered' THEN 1 WHEN 'draft' THEN 2 ELSE 3 END,
             w.week_start DESC
  `).all(...params) as Record<string, unknown>[]
  return rows.map(r => ({
    ...rowToWeek(r),
    userName: (r.user_name as string | null) ?? undefined,
    userEmail: r.user_email as string,
    jobName: r.job_name as string,
    totalMinutes: (r.total_minutes as number) ?? 0,
  }))
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

function transition(week: TimesheetWeek, allowedFrom: WeekStatus[], to: WeekStatus, extraSql?: { sql: string, params: unknown[] }) {
  if (!allowedFrom.includes(week.status)) {
    throw createError({ statusCode: 409, statusMessage: `Cannot change a ${week.status} week to ${to}.` })
  }
  const db = getDb()
  db.prepare(`UPDATE timesheet_weeks SET status = ? WHERE id = ?`).run(to, week.id)
  if (extraSql) db.prepare(extraSql.sql).run(...extraSql.params)
}

export function submitWeek(week: TimesheetWeek, actorUserId: string) {
  const db = getDb()
  db.transaction(() => {
    transition(week, ['draft'], 'submitted', {
      sql: 'UPDATE timesheet_weeks SET submitted_at = ? WHERE id = ?',
      params: [new Date().toISOString(), week.id],
    })
    addEvent(week.id, actorUserId, 'submitted')
  })()
}

export function approveWeek(week: TimesheetWeek, actorUserId: string, snapshot: WeekPayroll) {
  const db = getDb()
  db.transaction(() => {
    transition(week, ['submitted'], 'approved', {
      sql: 'UPDATE timesheet_weeks SET approved_at = ?, approved_snapshot = ? WHERE id = ?',
      params: [new Date().toISOString(), JSON.stringify(snapshot), week.id],
    })
    addEvent(week.id, actorUserId, 'approved')
  })()
}

/** Employee accepting the admin's alteration — final approval. */
export function confirmWeek(week: TimesheetWeek, actorUserId: string, snapshot: WeekPayroll) {
  const db = getDb()
  db.transaction(() => {
    transition(week, ['altered'], 'approved', {
      sql: 'UPDATE timesheet_weeks SET approved_at = ?, approved_snapshot = ? WHERE id = ?',
      params: [new Date().toISOString(), JSON.stringify(snapshot), week.id],
    })
    addEvent(week.id, actorUserId, 'confirmed')
  })()
}

export function reopenWeek(week: TimesheetWeek, actorUserId: string) {
  const db = getDb()
  db.transaction(() => {
    transition(week, ['submitted', 'altered'], 'draft', {
      sql: 'UPDATE timesheet_weeks SET submitted_at = NULL WHERE id = ?',
      params: [week.id],
    })
    addEvent(week.id, actorUserId, 'reopened')
  })()
}

/** Admin editing a submitted week — applies the new entries and records the diff. */
export function alterWeek(week: TimesheetWeek, actorUserId: string, entries: EntryInput[], note?: string) {
  const db = getDb()
  const before = getEntries(week.id)
  db.transaction(() => {
    transition(week, ['submitted', 'altered'], 'altered')
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
