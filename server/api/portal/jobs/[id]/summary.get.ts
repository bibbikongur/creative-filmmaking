// Lightweight job header for the job page — readable by company admins AND
// active crew members (unlike members.get, which stays admin-only). `isAdmin`
// tells the page which cards to show. Unknown/foreign job → 404.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const user = await requirePortalUser(event)
  if (!userCanAccessJob(user.id, id)) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }
  const job = getJob(id)
  if (!job) throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  const memberCount = (getDb().prepare(
    'SELECT COUNT(*) AS n FROM job_members WHERE job_id = ? AND status = \'active\'',
  ).get(id) as { n: number }).n
  return { job, memberCount, isAdmin: userIsJobAdmin(user.id, id) }
})
