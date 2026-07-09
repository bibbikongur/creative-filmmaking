export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const ctx = await requireWeekReviewer(event, id)
  const { week } = ctx

  const submitter = getUserById(week.userId)
  const job = getJob(week.jobId)
  return {
    week,
    user: submitter ? { id: submitter.id, email: submitter.email, name: submitter.name } : null,
    job: job ? { id: job.id, name: job.name } : null,
    departmentName: departmentNameForMember(week.jobId, week.userId),
    dayRate: getMemberDayRate(week.jobId, week.userId),
    entries: getEntries(week.id),
    payroll: payrollForWeek(week),
    events: getWeekEvents(week.id),
    capabilities: weekCapabilities(ctx),
  }
})
