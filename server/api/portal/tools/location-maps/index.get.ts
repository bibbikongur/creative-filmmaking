export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  // ?job= narrows to maps linked to that job ("Hjálpargögn" on the job page).
  const jobId = requireToolJob(user.id, getQuery(event).job)
  return listLocationMaps(user.id, jobId ?? undefined)
})
