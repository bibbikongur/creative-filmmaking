export default defineEventHandler(async (event) => {
  const { companyIds } = await requireAnyCompanyAdmin(event)
  return listJobs(companyIds)
})
