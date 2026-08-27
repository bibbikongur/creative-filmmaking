export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  // ?job= narrows to plans linked to that job ("Hjálpargögn" on the job page).
  const jobId = requireToolJob(user.id, getQuery(event).job)
  return listReccePlans(user.id, jobId ?? undefined)
})
