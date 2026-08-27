// Update a cost code: number, name and/or which department it belongs to.
// Company admins only.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const codeId = getRouterParam(event, 'codeId')!
  const ctx = await requirePurchaseOrderAccess(event, id)
  if (!ctx.isJobAdmin) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const body = await readBody<{ code?: string, name?: string, departmentId?: string, budget?: unknown }>(event)
    .catch(() => ({} as Record<string, never>))

  const departmentId = body?.departmentId || null
  if (departmentId && !departmentBelongsToJob(departmentId, id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid department for this job.' })
  }

  const updated = updateCostCode(id, codeId, {
    code: validateCostCode(body?.code),
    name: validateCostCodeName(body?.name),
    departmentId,
    budget: validateBudget(body?.budget),
  })
  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Cost code not found' })
  return updated
})
