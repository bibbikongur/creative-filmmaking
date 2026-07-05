export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')!
  const user = await requireJobMember(event, jobId)

  const query = getQuery(event)
  const to = isIsoDate(String(query.to ?? '')) ? String(query.to) : new Date().toISOString().slice(0, 10)
  const from = isIsoDate(String(query.from ?? '')) ? String(query.from) : addDays(to, -7 * 26)

  const weeks = listWeeksForUser(user.id, jobId, from, to)
  return weeks.map(w => ({ ...w, payroll: payrollForWeek(w) }))
})
