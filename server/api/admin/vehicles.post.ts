import { randomBytes } from 'node:crypto'
import type { Vehicle } from '~~/app/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const payload = parseVehiclePayload(await readBody(event))
  const vehicles = await getVehicles()

  if (vehicles.some(v => v.slug === payload.slug)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: [`Slug "${payload.slug}" is already used by another vehicle.`] },
    })
  }

  const vehicle: Vehicle = {
    id: `v-${Date.now().toString(36)}${randomBytes(2).toString('hex')}`,
    ...payload,
  }
  await saveVehicles([...vehicles, vehicle])
  return vehicle
})
