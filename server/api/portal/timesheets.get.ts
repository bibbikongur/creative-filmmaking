import type { WeekStatus } from '~~/app/types'

const STATUSES: WeekStatus[] = ['draft', 'submitted', 'altered', 'approved']

export default defineEventHandler(async (event) => {
  const { companyIds } = await requireAnyCompanyAdmin(event)
  const query = getQuery(event)
  const status = STATUSES.includes(query.status as WeekStatus) ? query.status as WeekStatus : undefined
  const jobId = query.jobId ? String(query.jobId) : undefined
  return listWeeksForCompanies(companyIds, { status, jobId })
})
