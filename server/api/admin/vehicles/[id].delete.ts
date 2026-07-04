export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const vehicles = await getVehicles()
  if (!vehicles.some(v => v.id === id)) {
    throw createError({ statusCode: 404, statusMessage: 'Vehicle not found' })
  }

  await saveVehicles(vehicles.filter(v => v.id !== id))
  return { ok: true }
})
