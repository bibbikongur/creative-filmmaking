// Approve/reject an order, mark it paid/unpaid, or re-book it onto another
// cost code. Company admins only; re-deciding is allowed.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const poId = getRouterParam(event, 'poId')!
  const ctx = await requirePurchaseOrderAccess(event, id)
  if (!ctx.isJobAdmin) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const body = await readBody<{
    action?: string
    note?: string
    costCodeId?: string | null
    departmentId?: string | null
    vatRate?: unknown
    rebateEligible?: unknown
    actualAmount?: unknown
  }>(event).catch(() => ({} as Record<string, never>))

  if (body?.action === 'paid' || body?.action === 'unpaid') {
    const order = setPurchaseOrderPaid(id, poId, {
      paid: body.action === 'paid',
      userId: ctx.user.id,
      actualAmount: validateActualAmount(body.actualAmount),
    })
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    return order
  }

  if (body?.action === 'approve' || body?.action === 'reject') {
    const before = getPurchaseOrder(id, poId)
    const order = decidePurchaseOrder(id, poId, {
      status: body.action === 'approve' ? 'approved' : 'rejected',
      decidedBy: ctx.user.id,
      note: validateDecisionNote(body.note),
    })
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })

    // Tell the creator, once per real status change, never about their own click.
    if (before && before.status !== order.status && order.createdById !== ctx.user.id
      && (order.status === 'approved' || order.status === 'rejected')) {
      const creator = getUserById(order.createdById)
      const job = getJob(id)
      if (creator && job) {
        await sendPoDecidedEmail({
          email: creator.email,
          locale: creator.locale,
          jobId: id,
          jobName: job.name,
          poNo: `PO-${String(order.poNumber).padStart(3, '0')}`,
          vendor: order.vendor,
          status: order.status,
          deciderName: ctx.user.name || ctx.user.email,
          note: order.decisionNote,
        }).catch(e => console.error('[portal] po decided email failed:', e))
      }
    }
    return order
  }

  if (body && 'departmentId' in body) {
    const departmentId = body.departmentId || null
    if (departmentId && !departmentBelongsToJob(departmentId, id)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid department for this job.' })
    }
    const order = setPurchaseOrderDepartment(id, poId, departmentId)
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    return order
  }

  if (body && 'costCodeId' in body) {
    const costCodeId = body.costCodeId || null
    if (costCodeId && !costCodeBelongsToJob(costCodeId, id)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid cost code for this job.' })
    }
    const order = setPurchaseOrderCostCode(id, poId, costCodeId)
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    return order
  }

  // Field patches: VAT rate, rebate flag, or a correction of the actual paid amount.
  if (body && ('vatRate' in body || 'rebateEligible' in body || 'actualAmount' in body)) {
    if ('actualAmount' in body) {
      const existing = getPurchaseOrder(id, poId)
      if (!existing) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
      if (!existing.paidAt) {
        throw createError({ statusCode: 409, statusMessage: 'Actual amount is only recorded on paid orders.' })
      }
    }
    const order = setPurchaseOrderMeta(id, poId, {
      ...('vatRate' in body ? { vatRate: validateVatRate(body.vatRate) } : {}),
      ...('rebateEligible' in body ? { rebateEligible: Boolean(body.rebateEligible) } : {}),
      ...('actualAmount' in body ? { actualAmount: validateActualAmount(body.actualAmount) } : {}),
    })
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    return order
  }

  throw createError({ statusCode: 400, statusMessage: 'Unknown action.' })
})
