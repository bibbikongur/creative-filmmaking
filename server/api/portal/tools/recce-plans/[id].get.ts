export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const doc = getReccePlan(user.id, getRouterParam(event, 'id')!)
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Plan not found' })
  return doc
})
