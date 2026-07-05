import { describe, expect, it } from 'vitest'
import { computePayroll, type PayrollShift } from '../server/utils/payroll'

// Day rate 120 000 ISK → OT hourly = 120000 / 12 × 1.78 = 17 800 ISK.
const RATE = 120000
const OT = 17800

const week = { from: '2026-06-29', to: '2026-07-05' } // Mon–Sun

const shift = (date: string, start: string, end: string, nextDay = false): PayrollShift => {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h! * 60 + m!
  }
  return { date, startMin: toMin(start), endMin: toMin(end) + (nextDay ? 1440 : 0) }
}

describe('computePayroll', () => {
  it('pays the flat day rate for a day of up to 12 hours', () => {
    const res = computePayroll([shift('2026-06-29', '08:00', '18:00')], RATE, week.from, week.to)
    expect(res.days).toHaveLength(1)
    expect(res.days[0]).toMatchObject({
      hours: 10, otHours: 0, restViolationHours: 0, streakIndex: 1,
      doublePay: false, baseAmount: RATE, otAmount: 0, restViolationAmount: 0, total: RATE,
    })
    expect(res.totals.amount).toBe(RATE)
    expect(res.hourlyOtRate).toBe(OT)
  })

  it('pays OT for every hour beyond 12 in a day', () => {
    const res = computePayroll([shift('2026-06-29', '07:00', '21:00')], RATE, week.from, week.to) // 14h
    expect(res.days[0]!.otHours).toBe(2)
    expect(res.days[0]!.otAmount).toBe(2 * OT)
    expect(res.days[0]!.total).toBe(RATE + 2 * OT)
  })

  it('first-ever shift never triggers a rest violation', () => {
    const res = computePayroll([shift('2026-06-29', '00:30', '10:00')], RATE, week.from, week.to)
    expect(res.days[0]!.restViolationHours).toBe(0)
  })

  it('pays 1 OT hour per missing rest hour when the gap is under 11h', () => {
    const res = computePayroll([
      shift('2026-06-29', '10:00', '22:00'),
      shift('2026-06-30', '06:00', '16:00'), // gap 8h → 3 missing rest hours
    ], RATE, week.from, week.to)
    expect(res.days[1]!.restViolationHours).toBe(3)
    expect(res.days[1]!.restViolationAmount).toBe(3 * OT)
    expect(res.totals.amount).toBe(2 * RATE + 3 * OT)
  })

  it('an exact 11h gap is not a violation', () => {
    const res = computePayroll([
      shift('2026-06-29', '08:00', '20:00'),
      shift('2026-06-30', '07:00', '17:00'), // gap exactly 11h
    ], RATE, week.from, week.to)
    expect(res.totals.restViolationHours).toBe(0)
  })

  it('measures the rest gap from the true end of a cross-midnight shift', () => {
    const res = computePayroll([
      shift('2026-06-29', '18:00', '04:00', true), // ends 04:00 on the 30th
      shift('2026-06-30', '10:00', '20:00'), // gap 6h → 5 missing rest hours
    ], RATE, week.from, week.to)
    expect(res.days[0]!.hours).toBe(10) // counted on its start date
    expect(res.days[1]!.restViolationHours).toBe(5)
  })

  it('pools split shifts into one day rate and checks intra-day gaps', () => {
    const res = computePayroll([
      shift('2026-06-29', '06:00', '12:00'),
      shift('2026-06-29', '16:00', '24:00'), // 4h gap → 7 missing rest hours; 14h pooled → 2h OT
    ], RATE, week.from, week.to)
    expect(res.days).toHaveLength(1)
    const day = res.days[0]!
    expect(day.hours).toBe(14)
    expect(day.otHours).toBe(2)
    expect(day.restViolationHours).toBe(7)
    expect(day.total).toBe(RATE + 2 * OT + 7 * OT)
  })

  it('doubles the 7th consecutive day only', () => {
    const shifts = ['2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05']
      .map(d => shift(d, '08:00', '18:00'))
    const res = computePayroll(shifts, RATE, week.from, week.to)
    expect(res.days.map(d => d.doublePay)).toEqual([false, false, false, false, false, false, true])
    expect(res.days[6]!.total).toBe(2 * RATE)
    expect(res.totals.doubleDays).toBe(1)
    expect(res.totals.amount).toBe(6 * RATE + 2 * RATE)
  })

  it('day 8 is normal rate; day 14 doubles again on an unbroken streak', () => {
    const dates = Array.from({ length: 14 }, (_, i) =>
      new Date(Date.UTC(2026, 5, 29 + i)).toISOString().slice(0, 10))
    const res = computePayroll(dates.map(d => shift(d, '08:00', '18:00')), RATE, '2026-06-29', '2026-07-12')
    const doubles = res.days.filter(d => d.doublePay).map(d => d.streakIndex)
    expect(doubles).toEqual([7, 14])
    expect(res.days[7]!.doublePay).toBe(false) // day 8
  })

  it('doubles OT too on a double-pay day, but not the rest penalty', () => {
    const dates = Array.from({ length: 7 }, (_, i) =>
      new Date(Date.UTC(2026, 5, 29 + i)).toISOString().slice(0, 10))
    const shifts = dates.map((d, i) => (i === 6 ? shift(d, '08:00', '23:00') : shift(d, '08:00', '18:00')))
    // day 7: 15h → 3h OT, gap from day 6 (18:00 → 08:00 = 14h) fine
    const res = computePayroll(shifts, RATE, week.from, week.to)
    const day7 = res.days[6]!
    expect(day7.doublePay).toBe(true)
    expect(day7.baseAmount).toBe(2 * RATE)
    expect(day7.otAmount).toBe(2 * 3 * OT)
  })

  it('a 35h+ break resets the consecutive-day streak', () => {
    const res = computePayroll([
      ...['2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04']
        .map(d => shift(d, '08:00', '18:00')),
      // day 6 ends Jul 4 18:00; next shift Jul 6 08:00 → gap 38h → reset
      shift('2026-07-06', '08:00', '18:00'),
    ], RATE, '2026-06-29', '2026-07-12')
    expect(res.days[6]!.streakIndex).toBe(1)
    expect(res.days[6]!.doublePay).toBe(false)
    expect(res.totals.doubleDays).toBe(0)
  })

  it('an exact 35h gap resets the streak', () => {
    const res = computePayroll([
      shift('2026-06-29', '08:00', '18:00'),
      shift('2026-07-01', '05:00', '15:00'), // 18:00 +35h = 05:00 two days later
    ], RATE, week.from, week.to)
    expect(res.days[1]!.streakIndex).toBe(1)
  })

  it('seeds streaks and gaps from lookback shifts before the range', () => {
    const res = computePayroll([
      // lookback: Thu–Sun of the previous week
      ...['2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28'].map(d => shift(d, '08:00', '18:00')),
      // in range: Mon–Wed → Wed is consecutive day 7
      ...['2026-06-29', '2026-06-30', '2026-07-01'].map(d => shift(d, '08:00', '18:00')),
    ], RATE, week.from, week.to)
    expect(res.days).toHaveLength(3) // lookback days are not in the output
    expect(res.days.map(d => d.streakIndex)).toEqual([5, 6, 7])
    expect(res.days[2]!.doublePay).toBe(true)
  })

  it('handles an empty week', () => {
    const res = computePayroll([], RATE, week.from, week.to)
    expect(res.days).toHaveLength(0)
    expect(res.totals).toMatchObject({ daysWorked: 0, hours: 0, amount: 0 })
  })
})
