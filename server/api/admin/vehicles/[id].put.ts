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
  if (vehicles.some(v => v.id !== id && v.slug === payload.slug)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: [`Slug "${payload.slug}" is already used by another vehicle.`] },
    })
  }

  const vehicle: Vehicle = { id: vehicles[index]!.id, ...payload }
  const next = [...vehicles]
  next[index] = vehicle
  await saveVehicles(next)
  return vehicle
})
