export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')!
  const user = await requireJobMember(event, jobId)

  const query = getQuery(event)
  const to = isIsoDate(String(query.to ?? '')) ? String(query.to) : new Date().toISOString().slice(0, 10)
  let from = isIsoDate(String(query.from ?? '')) ? String(query.from) : addDays(to, -7 * 26)
  // Payroll is computed per returned week; keep the span to two years at most.
  if (from < addDays(to, -730)) from = addDays(to, -730)

  const weeks = listWeeksForUser(user.id, jobId, from, to)
  return weeks.map(w => ({ ...w, payroll: payrollForWeek(w) }))
})
