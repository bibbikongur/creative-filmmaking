import { renderSVG } from 'uqr'

// Step 1 of enrollment: mint a secret and hand it over as a QR code plus the
// plain key for manual entry. Nothing is active until enable.post confirms a
// code from the app. Asks for the password again: the secret is as sensitive
// as the password itself.
export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: unknown }>(event).catch(() => null)
  await requireAdminReauth(event, body?.password)

  if (twoFactorResetRequested()) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Remove the NUXT_ADMIN_TWO_FACTOR_RESET variable and restart before enabling two-factor.',
    })
  }
  if (adminTwoFactorEnabled()) {
    throw createError({ statusCode: 409, statusMessage: 'Two-factor is already on. Turn it off first to enroll a new device.' })
  }

  const secret = beginAdminTwoFactorSetup()
  const uri = totpUri(secret, 'admin', 'Creative Filmmaking')
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return {
    secret,
    uri,
    // Black on white with a quiet zone: scannable on the dark admin theme.
    qrSvg: renderSVG(uri, { border: 2, ecc: 'M' }),
  }
})
