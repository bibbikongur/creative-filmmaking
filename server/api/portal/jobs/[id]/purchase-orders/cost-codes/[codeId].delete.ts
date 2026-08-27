// Delete a cost code. Its orders stay but lose the booking. Company admins only.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const codeId = getRouterParam(event, 'codeId')!
  const ctx = await requirePurchaseOrderAccess(event, id)
  if (!ctx.isJobAdmin) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  if (!deleteCostCode(id, codeId)) {
    throw createError({ statusCode: 404, statusMessage: 'Cost code not found' })
  }
  return { ok: true }
})
