const isRateLimited = makeRateLimiter(60_000, 10)

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (isRateLimited(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests.' })
  }

  const token = getRouterParam(event, 'token')!
  const body = await readBody<{ password?: string, name?: string }>(event)
  const password = String(body?.password ?? '')
  const name = String(body?.name ?? '').trim()

  const errors: string[] = []
  if (password.length < 10) errors.push('Password must be at least 10 characters.')
  if (password.length > 200) errors.push('Password is too long.')
  if (name.length > 120) errors.push('Name is too long.')
  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors } })
  }

  const user = acceptInvite(token, { password, name: name || undefined })
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'This invitation link is invalid or has expired.' })
  }

  const session = await getPortalSession(event)
  await session.update({ uid: user.id })
  return { ok: true, user, memberships: membershipsForUser(user.id) }
})
