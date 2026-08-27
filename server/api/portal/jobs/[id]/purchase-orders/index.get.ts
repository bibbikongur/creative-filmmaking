import type { PurchaseOrderList } from '~~/app/types'

// One job's purchase orders, scoped to the caller: the company admin sees
// every order, a department admin only their own department's.
export default defineEventHandler(async (event): Promise<PurchaseOrderList> => {
  const id = getRouterParam(event, 'id')!
  const ctx = await requirePurchaseOrderAccess(event, id)
  const scope = ctx.viewAll ? undefined : { departmentIds: ctx.departmentIds }
  // Admins and view-all loggers pick any department; scoped log members only
  // their granted ones.
  const departments = (ctx.isJobAdmin || ctx.viewAll
    ? listDepartments(id)
    : listDepartments(id).filter(d => ctx.departmentIds.includes(d.id)))
    .map(d => ({ id: d.id, name: d.name }))
  // Budgets are the admin's frame — dept heads only see spend, so the budget
  // figure is stripped server-side rather than merely hidden in the UI.
  const costCodes = listCostCodes(id, scope)
    .map(c => ctx.viewAll ? c : { ...c, budget: undefined })
  return {
    isJobAdmin: ctx.isJobAdmin,
    canLog: ctx.canLog,
    viewAll: ctx.viewAll,
    departments,
    costCodes,
    orders: listPurchaseOrders(id, scope),
  }
})
