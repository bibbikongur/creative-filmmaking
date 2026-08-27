export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const body = await readBody(event).catch(() => ({}))
  const patch: { name?: string, pages?: ReturnType<typeof validatePages> } = {}
  if (body?.name !== undefined) patch.name = validateMapName(body.name)
  if (body?.pages !== undefined) patch.pages = validatePages(body.pages)
  const doc = updateLocationMap(user.id, getRouterParam(event, 'id')!, patch)
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Map not found' })
  return doc
})
