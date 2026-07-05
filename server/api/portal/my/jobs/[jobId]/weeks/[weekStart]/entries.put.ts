export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')!
  const user = await requireJobMember(event, jobId)
  const weekStart = getRouterParam(event, 'weekStart')!

  const week = getOrCreateWeek(user.id, jobId, weekStart)
  const entries = parseEntries(await readBody(event), week.weekStart)
  replaceEntries(week.id, entries)

  return {
    week: getWeekById(week.id),
    entries: getEntries(week.id),
    payroll: payrollForWeek(week),
  }
})
