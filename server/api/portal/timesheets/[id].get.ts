export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const week = Number.isInteger(id) ? getWeekById(id) : null
  if (!week) throw createError({ statusCode: 404, statusMessage: 'Timesheet not found' })
  await requireJobAdmin(event, week.jobId)

  const user = getUserById(week.userId)
  const job = getJob(week.jobId)
  return {
    week,
    user: user ? { id: user.id, email: user.email, name: user.name } : null,
    job: job ? { id: job.id, name: job.name } : null,
    dayRate: getMemberDayRate(week.jobId, week.userId),
    entries: getEntries(week.id),
    payroll: payrollForWeek(week),
    events: getWeekEvents(week.id),
  }
})
