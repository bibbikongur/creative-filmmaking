// One equipment item with its full copy, for its own page.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const item = (await getEquipment()).find(e => e.id === id)
  if (!item) throw createError({ statusCode: 404, statusMessage: 'Equipment not found' })
  return item
})
