export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const week = Number.isInteger(id) ? getWeekById(id) : null
  if (!week) throw createError({ statusCode: 404, statusMessage: 'Timesheet not found' })
  const { user } = await requireJobAdmin(event, week.jobId)

  const snapshot = computeWeekPayroll(week)
  if (!snapshot) throw createError({ statusCode: 409, statusMessage: 'No day rate is set for this employee on this job.' })
  approveWeek(week, user.id, snapshot)
  return { week: getWeekById(week.id) }
})
