const MAX_BYTES = 15 * 1024 * 1024 // 15 MB

// Upload (or replace) the job's contract/NDA template PDF.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireJobAdmin(event, id)
  const kind = parseDocKind(getRouterParam(event, 'kind'))

  const job = getJob(id)!
  if (job.status !== 'active') {
    throw createError({ statusCode: 409, statusMessage: 'This job is closed.' })
  }

  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'file' && p.filename)
  if (!file?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No file received.' })
  }
  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'PDF is too large (max 15 MB).' })
  }

  return saveTemplate(id, kind, {
    data: file.data,
    originalName: (file.filename || 'template.pdf').slice(0, 200),
  })
})
