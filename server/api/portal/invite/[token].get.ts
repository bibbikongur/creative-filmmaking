const isRateLimited = makeRateLimiter(60_000, 10)

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (isRateLimited(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests.' })
  }

  const token = getRouterParam(event, 'token')!
  const user = findByToken(token, 'invite')
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'This invitation link is invalid or has expired.' })
  }

  // Show what the invite is for: the companies/jobs already attached to the account.
  const memberships = membershipsForUser(user.id)
  return {
    email: user.email,
    name: user.name,
    locale: user.locale,
    companies: memberships.adminCompanies.map(c => c.name),
    jobs: memberships.jobs.map(j => ({ jobName: j.jobName, companyName: j.companyName })),
  }
})
