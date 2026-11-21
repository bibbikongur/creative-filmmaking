import { randomBytes } from 'node:crypto'
import type { Vehicle } from '~~/app/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const payload = parseVehiclePayload(await readBody(event))
  const vehicles = await getVehicles()

  const vehicle: Vehicle = {
    id: `v-${Date.now().toString(36)}${randomBytes(2).toString('hex')}`,
    ...payload,
  }
  assertUniqueVehicleSlugs(vehicle, vehicles)
  await saveVehicles([...vehicles, vehicle])
  return vehicle
})
