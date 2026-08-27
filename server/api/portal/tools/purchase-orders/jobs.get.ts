// Jobs where the signed-in user can use the purchase-order tool: company
// admins (every job of their companies) and department admins (their jobs).
export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  return listPurchaseOrderJobs(user.id)
})
