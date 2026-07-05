export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')!
  const user = await requireJobMember(event, jobId)
  const weekStart = getRouterParam(event, 'weekStart')!

  const week = getOrCreateWeek(user.id, jobId, weekStart)
  const snapshot = computeWeekPayroll(week)
  if (!snapshot) throw createError({ statusCode: 409, statusMessage: 'No day rate is set for this job.' })
  confirmWeek(week, user.id, snapshot)
  return { week: getWeekById(week.id) }
})
