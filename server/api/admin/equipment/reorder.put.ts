export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = (await readBody(event)) ?? {}
  const ids = (Array.isArray(body.ids) ? body.ids : [])
    .filter((v: unknown): v is string => typeof v === 'string')

  const items = await getEquipment()
  const byId = new Map(items.map(e => [e.id, e]))
  const valid = ids.length === items.length
    && new Set(ids).size === ids.length
    && ids.every(id => byId.has(id))
  if (!valid) {
    throw createError({ statusCode: 400, statusMessage: 'ids must include every equipment id exactly once' })
  }

  const next = ids.map(id => byId.get(id)!)
  await saveEquipment(next)
  return next
})
