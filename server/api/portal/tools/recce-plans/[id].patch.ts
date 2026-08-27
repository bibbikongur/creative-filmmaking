export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const body = await readBody(event).catch(() => ({}))
  const patch: { name?: string, data?: ReturnType<typeof validatePlanData> } = {}
  if (body?.name !== undefined) patch.name = validatePlanName(body.name)
  if (body?.data !== undefined) patch.data = validatePlanData(body.data)
  const doc = updateReccePlan(user.id, getRouterParam(event, 'id')!, patch)
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Plan not found' })
  return doc
})
