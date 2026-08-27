import { promises as fs } from 'node:fs'

const isRateLimited = makeRateLimiter(60_000, 30)

// Streams the template PDF to the signing page viewer.
export default defineEventHandler(async (event) => {
  if (isRateLimited(getClientIp(event))) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests.' })
  }

  const req = findSigningRequest(getRouterParam(event, 'token')!)
  const template = req && getTemplate(req.jobId, req.kind)
  if (!template) {
    throw createError({ statusCode: 404, statusMessage: 'This signing link is invalid or has expired.' })
  }

  const data = await fs.readFile(templateFilePath(template.fileName)).catch(() => null)
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Document is missing.' })
  }

  setResponseHeaders(event, {
    'content-type': 'application/pdf',
    'cache-control': 'no-store',
  })
  return data
})
