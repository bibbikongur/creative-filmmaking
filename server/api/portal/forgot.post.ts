const isRateLimited = makeRateLimiter(60_000, 5)
// Per address too, so rotating IPs cannot bury one user in reset emails.
const addressFlooded = makeRateLimiter(60 * 60 * 1000, 3)

export default defineEventHandler(async (event) => {
  if (!portalConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Portal is not configured.' })
  }

  const ip = getClientIp(event)
  if (isRateLimited(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests.' })
  }

  const body = await readBody<{ email?: string }>(event).catch(() => ({} as { email?: string }))
  const email = String(body?.email ?? '').trim()

  // Always 200 — never reveal whether an account exists.
  if (isValidEmail(email) && !addressFlooded(email.toLowerCase())) {
    const result = startPasswordReset(email)
    if (result) {
      // Not awaited: waiting for the mail server only when the account exists
      // would reveal, by response time, which addresses have one.
      void sendPasswordResetEmail({ email: result.user.email, locale: result.user.locale, token: result.token })
        .catch(e => console.error('[portal] reset email failed:', e))
    }
  }
  return { ok: true }
})
