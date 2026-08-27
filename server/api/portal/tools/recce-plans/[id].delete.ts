export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  if (!deleteReccePlan(user.id, getRouterParam(event, 'id')!)) {
    throw createError({ statusCode: 404, statusMessage: 'Plan not found' })
  }
  return { ok: true }
})
