import type { EquipmentCategoryDef } from '~~/app/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')!
  const existing = await getEquipmentCategory(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  }

  const payload = parseEquipmentCategoryPayload(await readBody(event), existing)
  const [categories, items] = await Promise.all([getEquipmentCategories(true), getEquipment()])

  // Archiving: the items must be moved to another category first, so no item
  // is left pointing at a category the site no longer shows.
  if (payload.status === 'archived' && existing.status !== 'archived') {
    const count = items.filter(e => e.category === id).length
    if (count) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: [`This category still has ${count} item${count === 1 ? '' : 's'}. Move them to another category before archiving.`] },
      })
    }
  }

  const category: EquipmentCategoryDef = { id, sort: existing.sort, ...payload }
  assertUniqueCategorySlugs(category, categories, items)
  return upsertEquipmentCategory(category)
})
