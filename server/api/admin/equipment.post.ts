import { randomBytes } from 'node:crypto'
import type { EquipmentItem } from '~~/app/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [items, categories] = await Promise.all([getEquipment(), getEquipmentCategories(true)])
  const activeIds = categories.filter(c => c.status === 'active').map(c => c.id)
  const payload = parseEquipmentPayload(await readBody(event), activeIds)

  const item: EquipmentItem = {
    id: `e-${Date.now().toString(36)}${randomBytes(2).toString('hex')}`,
    ...payload,
  }
  assertUniqueEquipmentSlug(item, items, categories)
  await saveEquipment([...items, item])
  return item
})
