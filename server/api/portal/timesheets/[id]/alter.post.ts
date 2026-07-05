export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const week = Number.isInteger(id) ? getWeekById(id) : null
  if (!week) throw createError({ statusCode: 404, statusMessage: 'Timesheet not found' })
  const { user, companyId } = await requireJobAdmin(event, week.jobId)

  const body = await readBody<{ entries?: unknown[], note?: string }>(event)
  const note = String(body?.note ?? '').trim().slice(0, 500)
  const entries = parseEntries(body, week.weekStart)

  alterWeek(week, user.id, entries, note || undefined)

  const employee = getUserById(week.userId)
  if (employee) {
    await sendAlterationEmail({
      email: employee.email,
      locale: employee.locale,
      companyName: getCompanySummary(companyId)?.name ?? 'Creative Filmmaking',
      jobName: getJob(week.jobId)?.name ?? '',
      weekStart: week.weekStart,
      note: note || undefined,
    }).catch(e => console.error('[portal] alteration email failed:', e))
  }

  return { week: getWeekById(week.id) }
})
