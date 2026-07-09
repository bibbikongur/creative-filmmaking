export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireJobAdmin(event, id)
  const deptId = getRouterParam(event, 'deptId')!
  if (!deleteDepartment(id, deptId)) {
    throw createError({ statusCode: 404, statusMessage: 'Department not found' })
  }
  return { ok: true }
})
