export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = (await readBody(event)) ?? {}
  const ids = (Array.isArray(body.ids) ? body.ids : [])
    .filter((v: unknown): v is string => typeof v === 'string')

  const categories = await getEquipmentCategories(true)
  const known = new Set(categories.map(c => c.id))
  const valid = ids.length === categories.length
    && new Set(ids).size === ids.length
    && ids.every((id: string) => known.has(id))
  if (!valid) {
    throw createError({ statusCode: 400, statusMessage: 'ids must include every category id exactly once' })
  }

  await reorderEquipmentCategories(ids)
  return getEquipmentCategories(true)
})
