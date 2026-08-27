// Folders that carry a map pin, for the overview map. ?root=<folderId> limits to
// that folder's subtree (e.g. every home under "Heimili Ármanns"); ?job=<jobId>
// limits to folders whose root is linked to that job; omit both for all.
export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const query = getQuery(event)
  const root = query.root
  const jobId = requireToolJob(user.id, query.job)
  return listPins(user.id, typeof root === 'string' && root ? root : null, jobId ?? undefined)
})
