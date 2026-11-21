// One vehicle with its full copy, for its own page. Registration numbers stay
// admin-only, as in the list.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const vehicle = (await getVehicles()).find(v => v.id === id)
  if (!vehicle) throw createError({ statusCode: 404, statusMessage: 'Vehicle not found' })
  return publicVehicle(vehicle)
})
