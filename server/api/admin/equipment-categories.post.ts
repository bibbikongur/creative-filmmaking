import { randomBytes } from 'node:crypto'
import type { EquipmentCategoryDef } from '~~/app/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const payload = parseEquipmentCategoryPayload(await readBody(event))
  const [categories, items] = await Promise.all([getEquipmentCategories(true), getEquipment()])

  const category: EquipmentCategoryDef = {
    id: `c-${Date.now().toString(36)}${randomBytes(2).toString('hex')}`,
    sort: categories.length,
    ...payload,
  }
  assertUniqueCategorySlugs(category, categories, items)
  return upsertEquipmentCategory(category)
})
