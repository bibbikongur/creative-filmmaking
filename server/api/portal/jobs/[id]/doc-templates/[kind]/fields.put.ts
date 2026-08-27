import type { TemplateField } from '~~/app/types'

// Persist the admin-placed fields (and the page count reported by pdf.js).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireJobAdmin(event, id)
  const kind = parseDocKind(getRouterParam(event, 'kind'))

  const job = getJob(id)!
  if (job.status !== 'active') {
    throw createError({ statusCode: 409, statusMessage: 'This job is closed.' })
  }

  const body = await readBody<{ fields?: TemplateField[], pageCount?: number }>(event)
  const fields = validateFields(body?.fields ?? [])
  const meta = saveFields(id, kind, fields, Number(body?.pageCount) || undefined)
  if (!meta) {
    throw createError({ statusCode: 404, statusMessage: 'No template uploaded.' })
  }
  return meta
})
