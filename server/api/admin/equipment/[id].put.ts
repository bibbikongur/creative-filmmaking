import type { EquipmentItem } from '~~/app/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const [items, categories] = await Promise.all([getEquipment(), getEquipmentCategories(true)])
  const index = items.findIndex(e => e.id === id)
  if (index === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Equipment not found' })
  }

  // An item may stay in an archived category it already belongs to, but can
  // only be moved into an active one.
  const current = items[index]!
  const allowedIds = categories
    .filter(c => c.status === 'active' || c.id === current.category)
    .map(c => c.id)
  const payload = parseEquipmentPayload(await readBody(event), allowedIds)
  const item: EquipmentItem = { id: current.id, ...payload }
  assertUniqueEquipmentSlug(item, items, categories)
  const next = [...items]
  next[index] = item
  await saveEquipment(next)
  return item
})
