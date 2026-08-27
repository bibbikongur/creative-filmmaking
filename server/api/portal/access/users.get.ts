// Everyone the signed-in company admin can manage tool access for: active
// members of jobs in their active companies, with each user's current
// allow-list (null = every tool).
export default defineEventHandler(async (event) => {
  const { companyIds } = await requireAnyCompanyAdmin(event)
  return listToolAccessUsers(companyIds)
})
