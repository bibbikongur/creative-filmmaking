const isRateLimited = makeRateLimiter(60_000, 10)

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (isRateLimited(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests.' })
  }

  const token = getRouterParam(event, 'token')!
  const body = await readBody<{ password?: string }>(event)
  const password = String(body?.password ?? '')

  if (password.length < 10 || password.length > 200) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: ['Password must be at least 10 characters.'] },
    })
  }

  const user = resetPassword(token, password)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'This reset link is invalid or has expired.' })
  }

  const session = await getPortalSession(event)
  await session.update({ uid: user.id, epoch: getUserEpoch(user.id) ?? 0 })
  return { ok: true }
})
