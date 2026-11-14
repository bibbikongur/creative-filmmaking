// Attach (or replace) the invoice/receipt on an existing order — invoices
// often arrive after the cost was logged. Allowed for the company admin and
// for the order's creator; scoped like every other order endpoint.
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
  if (!order || (!ctx.viewAll && !ctx.departmentIds.includes(order.departmentId ?? null))) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }
  if (!ctx.isJobAdmin && (order.createdById !== ctx.user.id || !ctx.canLog)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  // Once an order is approved, rejected or paid its receipt is evidence: only
  // an admin may replace it (replacing deletes the previous file).
  if (!ctx.isJobAdmin && order.status !== 'pending') {
    throw createError({ statusCode: 409, statusMessage: 'This order has been reviewed. Ask an admin to change the attachment.' })
  }

  const parts = (await readMultipartFormData(event)) ?? []
  const file = parts.find(p => p.name === 'file' && p.filename)
  if (!file?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No file received.' })
  }
  if (file.data.length > MAX_PO_ATTACHMENT_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Attachment is too large (max 10 MB).' })
  }

  return setPurchaseOrderAttachment(id, poId, {
    data: file.data,
    originalName: file.filename || 'attachment',
  })
})
