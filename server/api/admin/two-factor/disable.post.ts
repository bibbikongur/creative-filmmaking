// Turns two-factor off. Needs the password AND a current code (or a recovery
// code): a signed-in browser left unattended must not be able to do it.
export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: unknown, code?: unknown }>(event).catch(() => null)
  await requireAdminReauth(event, body?.password)

  if (!adminTwoFactorEnabled()) return { ok: true }
  if (!consumeAdminSecondFactor(typeof body?.code === 'string' ? body.code : '')) {
    throw createError({ statusCode: 403, statusMessage: 'Wrong code.' })
  }

  disableAdminTwoFactor()
  await issueAdminSession(event)
  return { ok: true }
})
