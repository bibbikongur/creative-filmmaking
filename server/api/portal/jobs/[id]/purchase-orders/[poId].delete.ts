// Delete an order: the creator while it's still pending, or the company admin.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const poId = getRouterParam(event, 'poId')!
  const ctx = await requirePurchaseOrderAccess(event, id)

  // Closed jobs are read-only for department admins; the admin may still settle.
  const job = getJob(id)
  if (job?.status !== 'active' && !ctx.isJobAdmin) {
    throw createError({ statusCode: 409, statusMessage: 'This job is closed.' })
  }

  const order = getPurchaseOrder(id, poId)
  // Orders outside the caller's scope don't exist as far as they can tell.
  if (!order || (!ctx.viewAll && !ctx.departmentIds.includes(order.departmentId ?? null))) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }
  const mayDelete = ctx.isJobAdmin || (order.createdById === ctx.user.id && order.status === 'pending')
  if (!mayDelete) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  deletePurchaseOrder(id, poId)
  return { ok: true }
})
