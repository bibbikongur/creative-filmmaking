export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')!
  const user = await requireJobMember(event, jobId)
  const weekStart = getRouterParam(event, 'weekStart')!

  const week = getOrCreateWeek(user.id, jobId, weekStart)
  if (!getEntries(week.id).length) {
    throw createError({ statusCode: 400, statusMessage: 'Add at least one shift before submitting.' })
  }
  submitWeek(week, user.id)
  return { week: getWeekById(week.id) }
})
