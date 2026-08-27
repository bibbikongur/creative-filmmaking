export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')!
  const user = await requireJobMember(event, jobId)
  const weekStart = getRouterParam(event, 'weekStart')!

  const week = getOrCreateWeek(user.id, jobId, weekStart)
  return {
    week,
    entries: getEntries(week.id),
    dayFlags: getDayFlags(week.id),
    perDiemRate: getJob(jobId)?.perDiemRate ?? 0,
    payroll: payrollForWeek(week),
    events: getWeekEvents(week.id),
  }
})
