import type { Vehicle } from '~~/app/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const vehicles = await getVehicles()
  const index = vehicles.findIndex(v => v.id === id)
  if (index === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Vehicle not found' })
  }

  const payload = parseVehiclePayload(await readBody(event))
  const vehicle: Vehicle = { id: vehicles[index]!.id, ...payload }
  assertUniqueVehicleSlugs(vehicle, vehicles)
  const next = [...vehicles]
  next[index] = vehicle
  await saveVehicles(next)
  return vehicle
})
