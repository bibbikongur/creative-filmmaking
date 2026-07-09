export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const ctx = await requireWeekReviewer(event, id)
  const caps = weekCapabilities(ctx)
  if (!caps.canAlter) {
    throw createError({ statusCode: 409, statusMessage: 'This week cannot be edited at its current stage.' })
  }
  const { week, user, isDeptApprover, companyId } = ctx

  const body = await readBody<{ entries?: unknown[], note?: string }>(event)
  const note = String(body?.note ?? '').trim().slice(0, 500)
  const entries = parseEntries(body, week.weekStart)

  // A department-stage edit still needs the job admin's final sign-off after the
  // employee confirms; a job-admin edit is final on confirmation.
  const target = (isDeptApprover && week.status === 'submitted') ? 'dept_approved' : 'approved'
  alterWeek(week, user.id, entries, target, note || undefined)

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
