// Log a new purchase order (multipart: vendor, amount, description, optional
// departmentId for admins, optional receipt file). Department admins always
// log against their own department.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const ctx = await requirePurchaseOrderAccess(event, id)
  if (!ctx.canLog) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const job = getJob(id)
  if (!job) throw createError({ statusCode: 404, statusMessage: 'Job not found.' })
  if (job.status !== 'active') {
    throw createError({ statusCode: 409, statusMessage: 'This job is closed.' })
  }

  const parts = (await readMultipartFormData(event)) ?? []
  const text = (name: string) => {
    const part = parts.find(p => p.name === name && !p.filename)
    return part ? part.data.toString('utf8') : undefined
  }

  const vendor = validateVendor(text('vendor'))
  const amount = validateAmount(text('amount'))
  const description = validateDescription(text('description'))
  const vatRate = validateVatRate(text('vatRate'))
  const rebateEligible = text('rebateEligible') === '1'

  // Admins and view-all loggers may book on any department of the job;
  // scoped log members only on their granted departments. Default: own dept.
  const anyDepartment = ctx.isJobAdmin || ctx.viewAll
  let departmentId = ctx.isJobAdmin
    ? null
    : anyDepartment || ctx.departmentIds.includes(ctx.homeDepartmentId)
      ? ctx.homeDepartmentId
      : ctx.departmentIds.find((d): d is string => typeof d === 'string') ?? null
  const requested = text('departmentId')
  if (requested) {
    if (anyDepartment) {
      if (!departmentBelongsToJob(requested, id)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid department for this job.' })
      }
    }
    else if (!ctx.departmentIds.includes(requested)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid department for this job.' })
    }
    departmentId = requested
  }

  // Anyone logging a cost may book it on a code they can see: department
  // admins their own department's codes plus shared ones, admins any code.
  let costCodeId: string | null = null
  const requestedCode = text('costCodeId')
  if (requestedCode) {
    const costCode = getCostCode(id, requestedCode)
    const visible = costCode
      && (ctx.isJobAdmin || ctx.viewAll || !costCode.departmentId || ctx.departmentIds.includes(costCode.departmentId))
    if (!visible) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid cost code for this job.' })
    }
    costCodeId = requestedCode
  }

  const file = parts.find(p => p.name === 'file' && p.filename)
  if (file && file.data.length > MAX_PO_ATTACHMENT_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Attachment is too large (max 10 MB).' })
  }

  const order = createPurchaseOrder(id, {
    userId: ctx.user.id,
    departmentId,
    costCodeId,
    vendor,
    description,
    amount,
    vatRate,
    rebateEligible,
    ...(file?.data?.length ? { attachment: { data: file.data, originalName: file.filename || 'attachment' } } : {}),
  })

  // A dept admin's order waits for approval — tell the company admins.
  // allSettled + catch: a bad address must never fail the request.
  if (!ctx.isJobAdmin) {
    const recipients = listJobAdminRecipients(id).filter(r => r.email !== ctx.user.email)
    await Promise.allSettled(recipients.map(r => sendPoSubmittedEmail({
      email: r.email,
      locale: r.locale,
      jobId: id,
      jobName: job.name,
      poNo: `PO-${String(order.poNumber).padStart(3, '0')}`,
      vendor: order.vendor,
      amountText: `${order.amount.toLocaleString('is-IS')} kr.`,
      creatorName: order.createdByName,
      departmentName: order.departmentName,
    }))).catch(e => console.error('[portal] po submitted email failed:', e))
  }

  return order
})
