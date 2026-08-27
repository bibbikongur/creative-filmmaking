// Signing statuses for the crew page.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireJobAdmin(event, id)
  return { docs: listMemberDocs(id) }
})
