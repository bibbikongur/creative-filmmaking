import { promises as fs } from 'node:fs'
import { join } from 'node:path'

// Download the signed contract/NDA (job admins only).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireJobAdmin(event, id)
  const userId = getRouterParam(event, 'userId')!
  const kind = parseDocKind(getRouterParam(event, 'kind'))

  const fileName = getSignedFileName(id, userId, kind)
  const data = fileName
    ? await fs.readFile(join(signedDocsDir(), fileName)).catch(() => null)
    : null
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'No signed document yet.' })
  }

  setResponseHeaders(event, {
    'content-type': 'application/pdf',
    'content-disposition': `attachment; filename="${kind}-signed.pdf"`,
    'cache-control': 'no-store',
  })
  return data
})
