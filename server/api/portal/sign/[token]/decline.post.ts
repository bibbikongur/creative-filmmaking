const isRateLimited = makeRateLimiter(60_000, 10)

export default defineEventHandler(async (event) => {
  if (isRateLimited(getClientIp(event))) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests.' })
  }

  const req = findSigningRequest(getRouterParam(event, 'token')!)
  if (!req) {
    throw createError({ statusCode: 404, statusMessage: 'This signing link is invalid or has expired.' })
  }

  declineSigning(req.id)
  return { ok: true }
})
