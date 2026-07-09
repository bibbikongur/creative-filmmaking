export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const ctx = await requireWeekReviewer(event, id)
  if (!weekCapabilities(ctx).canReopen) {
    throw createError({ statusCode: 409, statusMessage: 'This week cannot be reopened at its current stage.' })
  }
  reopenWeek(ctx.week, ctx.user.id)
  return { week: getWeekById(ctx.week.id) }
})
