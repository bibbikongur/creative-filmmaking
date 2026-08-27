import { promises as fs } from 'node:fs'

// Stream the template PDF to the field-placement editor. Auth-gated — template
// PDFs are private and deliberately not under the public /uploads route.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireJobAdmin(event, id)
  const kind = parseDocKind(getRouterParam(event, 'kind'))

  const template = getTemplate(id, kind)
  if (!template) {
    throw createError({ statusCode: 404, statusMessage: 'No template uploaded.' })
  }

  const data = await fs.readFile(templateFilePath(template.fileName)).catch(() => null)
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Template file is missing.' })
  }

  setResponseHeaders(event, {
    'content-type': 'application/pdf',
    'cache-control': 'no-store',
  })
  return data
})
