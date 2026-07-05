// Aggregated statistics for the company dashboard. Approved weeks read their
// frozen snapshot; open weeks are computed live at the current day rate.
export default defineEventHandler(async (event) => {
  const { companyIds } = await requireAnyCompanyAdmin(event)
  const query = getQuery(event)

  const to = isIsoDate(String(query.to ?? '')) ? String(query.to) : new Date().toISOString().slice(0, 10)
  const from = isIsoDate(String(query.from ?? '')) ? String(query.from) : addDays(to, -27)
  const jobId = query.jobId ? String(query.jobId) : undefined

  const weeks = listWeeksForCompanies(companyIds, { jobId })
    .filter(w => w.weekStart >= from && w.weekStart <= to)

  interface EmployeeAgg {
    userId: string
    name?: string
    email: string
    weeks: number
    daysWorked: number
    hours: number
    otHours: number
    restViolationHours: number
    doubleDays: number
    amount: number
    pendingWeeks: number
  }

  const perEmployee = new Map<string, EmployeeAgg>()
  const perWeek = new Map<string, { weekStart: string, hours: number, amount: number }>()
  const totals = { daysWorked: 0, hours: 0, otHours: 0, restViolationHours: 0, doubleDays: 0, amount: 0 }

  for (const w of weeks) {
    const payroll = payrollForWeek(w)
    if (!payroll || !payroll.totals.daysWorked) continue

    let emp = perEmployee.get(w.userId)
    if (!emp) {
      emp = {
        userId: w.userId, name: w.userName, email: w.userEmail,
        weeks: 0, daysWorked: 0, hours: 0, otHours: 0, restViolationHours: 0,
        doubleDays: 0, amount: 0, pendingWeeks: 0,
      }
      perEmployee.set(w.userId, emp)
    }
    emp.weeks += 1
    emp.daysWorked += payroll.totals.daysWorked
    emp.hours += payroll.totals.hours
    emp.otHours += payroll.totals.otHours
    emp.restViolationHours += payroll.totals.restViolationHours
    emp.doubleDays += payroll.totals.doubleDays
    emp.amount += payroll.totals.amount
    if (w.status === 'submitted' || w.status === 'altered') emp.pendingWeeks += 1

    let bucket = perWeek.get(w.weekStart)
    if (!bucket) {
      bucket = { weekStart: w.weekStart, hours: 0, amount: 0 }
      perWeek.set(w.weekStart, bucket)
    }
    bucket.hours += payroll.totals.hours
    bucket.amount += payroll.totals.amount

    totals.daysWorked += payroll.totals.daysWorked
    totals.hours += payroll.totals.hours
    totals.otHours += payroll.totals.otHours
    totals.restViolationHours += payroll.totals.restViolationHours
    totals.doubleDays += payroll.totals.doubleDays
    totals.amount += payroll.totals.amount
  }

  const round = (n: number) => Math.round(n * 100) / 100
  return {
    from,
    to,
    totals: {
      ...totals,
      hours: round(totals.hours),
      otHours: round(totals.otHours),
      restViolationHours: round(totals.restViolationHours),
      employees: perEmployee.size,
    },
    perEmployee: [...perEmployee.values()]
      .map(e => ({ ...e, hours: round(e.hours), otHours: round(e.otHours), restViolationHours: round(e.restViolationHours) }))
      .sort((a, b) => b.amount - a.amount),
    perWeek: [...perWeek.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
  }
})
