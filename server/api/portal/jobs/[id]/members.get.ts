export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireJobAdmin(event, id)
  return { job: getJob(id), members: listMembers(id) }
})
