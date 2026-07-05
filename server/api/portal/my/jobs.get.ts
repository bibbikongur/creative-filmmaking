export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  return membershipsForUser(user.id).jobs
})
