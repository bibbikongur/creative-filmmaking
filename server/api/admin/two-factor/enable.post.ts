// Step 2 of enrollment: a code from the authenticator app proves the secret
// was stored, and switches two-factor on. The recovery codes in the response
// are shown exactly once.
const limited = makeRateLimiter(15 * 60 * 1000, 10)

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  if (limited(getClientIp(event))) {
    throw createError({ statusCode: 429, statusMessage: 'Too many attempts. Try again in 15 minutes.' })
  }
  if (adminTwoFactorEnabled()) {
    throw createError({ statusCode: 409, statusMessage: 'Two-factor is already on.' })
  }

  const body = await readBody<{ code?: unknown }>(event).catch(() => null)
  const recoveryCodes = confirmAdminTwoFactorSetup(typeof body?.code === 'string' ? body.code : '')
  if (!recoveryCodes) {
    throw createError({ statusCode: 400, statusMessage: 'That code did not match. Check the app and try again, or restart the setup.' })
  }

  // Switching it on voided every admin cookie (this one included): re-issue ours.
  await issueAdminSession(event)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return { ok: true, recoveryCodes }
})
