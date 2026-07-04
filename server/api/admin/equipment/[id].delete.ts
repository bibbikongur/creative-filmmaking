export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const items = await getEquipment()
  if (!items.some(e => e.id === id)) {
    throw createError({ statusCode: 404, statusMessage: 'Equipment not found' })
  }

  await saveEquipment(items.filter(e => e.id !== id))
  return { ok: true }
})
