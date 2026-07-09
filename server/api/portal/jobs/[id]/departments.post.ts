export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireJobAdmin(event, id)
  const body = await readBody<{ name?: string }>(event)
  return createDepartment(id, String(body?.name ?? ''))
})
