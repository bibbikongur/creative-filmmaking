import { randomBytes } from 'node:crypto'
import type { EquipmentItem } from '~~/app/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const payload = parseEquipmentPayload(await readBody(event))
  const items = await getEquipment()

  const item: EquipmentItem = {
    id: `e-${Date.now().toString(36)}${randomBytes(2).toString('hex')}`,
    ...payload,
  }
  await saveEquipment([...items, item])
  return item
})
