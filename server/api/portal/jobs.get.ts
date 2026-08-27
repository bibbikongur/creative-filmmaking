// Job list for the signed-in user: every job they administer (with review
// counts) plus every job they crew on. `role` drives what the UI offers.
export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const companyIds = membershipsForUser(user.id).adminCompanies.map(c => c.id)
  const admin = listJobs(companyIds).map(j => ({ ...j, role: 'admin' as const }))
  const adminIds = new Set(admin.map(j => j.id))
  const member = listMemberJobs(user.id)
    .filter(j => !adminIds.has(j.id))
    .map(j => ({ ...j, pendingWeeks: 0, role: 'member' as const }))
  return [...admin, ...member]
})
