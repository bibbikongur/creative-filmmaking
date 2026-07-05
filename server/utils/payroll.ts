import type { DayBreakdown, WeekPayroll } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Pay calculation for the timesheet portal — Icelandic film-industry rules:
//
//  • The day rate is flat pay for up to 12 hours on a calendar day (hours from
//    multiple shifts pool; a shift belongs to the day it STARTS on, even when
//    it runs past midnight).
//  • Overtime: every pooled hour beyond 12 pays dayRate / 12 × 1.78.
//  • Brot á hvíld: less than 11 hours of rest between two shifts pays one OT
//    hour for each missing rest hour (charged to the later shift's day).
//  • 7th consecutive worked day pays double (base + OT doubled; the rest
//    penalty is not doubled). Only day 7 itself — and day 14, 21, … if the
//    streak continues. The streak resets after a break of at least 35 hours.
//
// Pure module: no DB, no H3, no runtime config — unit-testable in isolation.
// Reykjavik is UTC year-round, so date arithmetic is plain Date.UTC.
// ─────────────────────────────────────────────────────────────────────────────

export interface PayrollShift {
  /** Start date 'YYYY-MM-DD' */
  date: string
  /** Minutes from midnight of `date` */
  startMin: number
  /** Minutes from midnight of `date`; > 1440 means the shift crosses midnight */
  endMin: number
}

export const OT_MULT = 1.78
export const BASE_HOURS = 12
export const REST_HOURS = 11
export const STREAK_RESET_HOURS = 35

const dateToUtcMin = (date: string) => Date.parse(`${date}T00:00:00Z`) / 60000

export const hourlyOtRate = (dayRate: number) => dayRate / BASE_HOURS * OT_MULT

/**
 * Compute the per-day pay breakdown for days in [rangeFrom, rangeTo].
 * `shifts` should include lookback shifts from before rangeFrom (~3 weeks)
 * so rest gaps and the consecutive-day streak seed correctly across weeks.
 */
export function computePayroll(
  shifts: PayrollShift[],
  dayRate: number,
  rangeFrom: string,
  rangeTo: string,
): WeekPayroll {
  const otRate = hourlyOtRate(dayRate)

  const sorted = shifts
    .map(s => ({
      date: s.date,
      startAbs: dateToUtcMin(s.date) + s.startMin,
      endAbs: dateToUtcMin(s.date) + s.endMin,
    }))
    .sort((a, b) => a.startAbs - b.startAbs)

  interface DayAccum { hours: number, restViolationHours: number, streakIndex: number }
  const perDay = new Map<string, DayAccum>()

  let prevEndAbs: number | null = null
  let streak = 0
  let lastWorkDate: string | null = null

  for (const s of sorted) {
    let day = perDay.get(s.date)
    if (!day) {
      day = { hours: 0, restViolationHours: 0, streakIndex: 0 }
      perDay.set(s.date, day)
    }

    if (prevEndAbs !== null) {
      const gapH = (s.startAbs - prevEndAbs) / 60
      if (gapH >= STREAK_RESET_HOURS) {
        streak = 0
        lastWorkDate = null
      }
      if (gapH >= 0 && gapH < REST_HOURS) {
        day.restViolationHours += REST_HOURS - gapH
      }
    }

    if (s.date !== lastWorkDate) {
      streak += 1
      lastWorkDate = s.date
    }
    day.hours += (s.endAbs - s.startAbs) / 60
    day.streakIndex = streak
    prevEndAbs = prevEndAbs === null ? s.endAbs : Math.max(prevEndAbs, s.endAbs)
  }

  const days: DayBreakdown[] = []
  for (const [date, d] of [...perDay.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (date < rangeFrom || date > rangeTo) continue
    const otHours = Math.max(0, d.hours - BASE_HOURS)
    const doublePay = d.streakIndex > 0 && d.streakIndex % 7 === 0
    const baseAmount = Math.round(dayRate * (doublePay ? 2 : 1))
    const otAmount = Math.round(otHours * otRate * (doublePay ? 2 : 1))
    const restViolationAmount = Math.round(d.restViolationHours * otRate)
    days.push({
      date,
      hours: round2(d.hours),
      otHours: round2(otHours),
      restViolationHours: round2(d.restViolationHours),
      streakIndex: d.streakIndex,
      doublePay,
      baseAmount,
      otAmount,
      restViolationAmount,
      total: baseAmount + otAmount + restViolationAmount,
    })
  }

  return {
    days,
    totals: {
      daysWorked: days.length,
      hours: round2(days.reduce((s, d) => s + d.hours, 0)),
      otHours: round2(days.reduce((s, d) => s + d.otHours, 0)),
      restViolationHours: round2(days.reduce((s, d) => s + d.restViolationHours, 0)),
      doubleDays: days.filter(d => d.doublePay).length,
      amount: days.reduce((s, d) => s + d.total, 0),
    },
    dayRate,
    hourlyOtRate: Math.round(otRate),
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100
