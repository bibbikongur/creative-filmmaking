export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireJobAdmin(event, id)
  const deptId = getRouterParam(event, 'deptId')!
  const body = await readBody<{ name?: string }>(event)
  if (!updateDepartment(id, deptId, String(body?.name ?? ''))) {
    throw createError({ statusCode: 404, statusMessage: 'Department not found' })
  }
  return { ok: true }
})
