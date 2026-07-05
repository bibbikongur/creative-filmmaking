export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const week = Number.isInteger(id) ? getWeekById(id) : null
  if (!week) throw createError({ statusCode: 404, statusMessage: 'Timesheet not found' })
  const { user } = await requireJobAdmin(event, week.jobId)

  reopenWeek(week, user.id)
  return { week: getWeekById(week.id) }
})
