const isRateLimited = makeRateLimiter(60_000, 30)

// Public signing page data: the document context, filled values and field
// positions. The token in the URL is the sole authentication. Marks the
// request as viewed on first open.
export default defineEventHandler(async (event) => {
  if (isRateLimited(getClientIp(event))) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests.' })
  }

  const req = findSigningRequest(getRouterParam(event, 'token')!)
  if (!req) {
    throw createError({ statusCode: 404, statusMessage: 'This signing link is invalid or has expired.' })
  }

  const job = getJob(req.jobId)
  const member = listMembers(req.jobId).find(m => m.userId === req.userId)
  const template = getTemplate(req.jobId, req.kind)
  if (!job || !member || !template) {
    throw createError({ statusCode: 404, statusMessage: 'This signing link is invalid or has expired.' })
  }

  markViewed(req.id)

  return {
    kind: req.kind,
    jobName: job.name,
    companyName: getCompanySummary(job.companyId)?.name ?? 'Creative Filmmaking',
    memberName: member.name ?? '',
    locale: member.locale,
    fields: template.fields,
    values: {
      name: member.name || member.email,
      role: member.role ?? '',
      email: member.email,
      phone: member.phone ?? '',
      dayRate: member.dayRate,
      sentDate: req.sentAt.slice(0, 10),
    },
  }
})
