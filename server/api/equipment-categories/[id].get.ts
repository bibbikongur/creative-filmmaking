// One active equipment category with its landing copy, for its own page.
export default defineEventHandler(async (event) => {
  const category = await getEquipmentCategory(getRouterParam(event, 'id') ?? '')
  if (!category || category.status !== 'active') throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  return category
})
