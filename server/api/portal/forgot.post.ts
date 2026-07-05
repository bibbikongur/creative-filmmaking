const isRateLimited = makeRateLimiter(60_000, 5)

export default defineEventHandler(async (event) => {
  if (!portalConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Portal is not configured.' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (isRateLimited(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests.' })
  }

  const body = await readBody<{ email?: string }>(event).catch(() => ({} as { email?: string }))
  const email = String(body?.email ?? '').trim()

  // Always 200 — never reveal whether an account exists.
  if (isValidEmail(email)) {
    const result = startPasswordReset(email)
    if (result) {
      await sendPasswordResetEmail({ email: result.user.email, locale: result.user.locale, token: result.token })
        .catch(e => console.error('[portal] reset email failed:', e))
    }
  }
  return { ok: true }
})
