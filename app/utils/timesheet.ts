// Small shared helpers for the timesheet portal UI.

/** 'HH:MM' → minutes from midnight. */
export const timeToMinutes = (t: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t)
  if (!m) return null
  const min = Number(m[1]) * 60 + Number(m[2])
  return min >= 0 && min < 1440 ? min : null
}

/** Minutes from midnight (may exceed 1440) → 'HH:MM' clock time. */
export const minutesToTime = (min: number): string => {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** ISO date of the Monday of the week containing `date` (UTC — Iceland). */
export const mondayOf = (date: Date): string => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dow = (d.getUTCDay() + 6) % 7 // Mon = 0
  d.setUTCDate(d.getUTCDate() - dow)
  return d.toISOString().slice(0, 10)
}

export const addDaysIso = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const formatIsk = (n: number, locale: string) =>
  `${Math.round(n).toLocaleString(locale === 'is' ? 'is-IS' : 'en-GB')} kr.`

export const formatHoursNum = (n: number) =>
  (Math.round(n * 100) / 100).toLocaleString('en-GB', { maximumFractionDigits: 2 })

export const formatShortDate = (iso: string, locale: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  })

export const formatWeekRange = (weekStart: string, locale: string) =>
  `${formatShortDate(weekStart, locale)} – ${formatShortDate(addDaysIso(weekStart, 6), locale)}`
