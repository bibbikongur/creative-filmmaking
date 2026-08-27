export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  // Root folders (no parent). Subfolders come embedded in a folder's detail.
  // ?job= narrows the roots to that job ("Hjálpargögn" on the job page).
  const query = getQuery(event)
  const parent = query.parent
  const jobId = requireToolJob(user.id, query.job)
  return listChildren(user.id, typeof parent === 'string' && parent ? parent : null, jobId ?? undefined)
})
