import type { WeekStatus } from '~~/app/types'

const STATUSES: WeekStatus[] = ['draft', 'submitted', 'dept_approved', 'altered', 'approved']

export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const memberships = membershipsForUser(user.id)
  const companyIds = memberships.adminCompanies.map(c => c.id)
  const departmentIds = memberships.deptAdmin.map(d => d.departmentId)
  if (!companyIds.length && !departmentIds.length) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const query = getQuery(event)
  const status = STATUSES.includes(query.status as WeekStatus) ? query.status as WeekStatus : undefined
  const jobId = query.jobId ? String(query.jobId) : undefined
  const departmentId = query.departmentId ? String(query.departmentId) : undefined

  return listReviewableWeeks(user.id, companyIds, departmentIds, { status, jobId, departmentId })
})
