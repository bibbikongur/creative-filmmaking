export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')!
  const user = await requireJobMember(event, jobId)
  const weekStart = getRouterParam(event, 'weekStart')!

  const week = getOrCreateWeek(user.id, jobId, weekStart)
  const body = await readBody(event)
  const entries = parseEntries(body, week.weekStart)
  const flags = parseDayFlags(body, week.weekStart)
  replaceEntries(week.id, entries, flags)

  return {
    week: getWeekById(week.id),
    entries: getEntries(week.id),
    dayFlags: getDayFlags(week.id),
    payroll: payrollForWeek(week),
  }
})
