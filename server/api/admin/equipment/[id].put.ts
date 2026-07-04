import type { EquipmentItem } from '~~/app/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const items = await getEquipment()
  const index = items.findIndex(e => e.id === id)
  if (index === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Equipment not found' })
  }

  const payload = parseEquipmentPayload(await readBody(event))
  const item: EquipmentItem = { id: items[index]!.id, ...payload }
  const next = [...items]
  next[index] = item
  await saveEquipment(next)
  return item
})
