// Approve advances the week one stage: a department admin's approval sends a
// submitted week up to the job admin (dept_approved); the job admin's approval
// (of a dept_approved week, or a submitted week with no department stage) is final.
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const ctx = await requireWeekReviewer(event, id)
  const caps = weekCapabilities(ctx)
  const { week, user } = ctx

  if (caps.canDeptApprove) {
    deptApproveWeek(week, user.id)
  }
  else if (caps.canJobApprove) {
    const snapshot = computeWeekPayroll(week)
    if (!snapshot) throw createError({ statusCode: 409, statusMessage: 'No day rate is set for this employee on this job.' })
    approveWeek(week, user.id, snapshot)
  }
  else {
    throw createError({ statusCode: 409, statusMessage: 'This week cannot be approved at its current stage.' })
  }
  return { week: getWeekById(week.id) }
})
