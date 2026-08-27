export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const body = await readBody(event).catch(() => ({}))
  const name = validateAlbumName(body?.name)
  const note = validateNote(body?.note)
  const parentId = typeof body?.parentId === 'string' && body.parentId ? body.parentId : null
  // Optional job link for ROOT folders — shows up under the job's "Hjálpargögn".
  const jobId = requireToolJob(user.id, body?.jobId)
  return createAlbum(user.id, name, note, parentId, jobId)
})
