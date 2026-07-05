export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const { companyId } = await requireJobAdmin(event, id)

  const job = getJob(id)!
  if (job.status !== 'active') {
    throw createError({ statusCode: 409, statusMessage: 'This job is closed.' })
  }

  const body = await readBody<{ email?: string, name?: string, dayRate?: number, locale?: string }>(event)
  const locale = body?.locale === 'en' ? 'en' : 'is'
  const { member, inviteToken } = addMember(id, {
    email: String(body?.email ?? ''),
    name: String(body?.name ?? '').trim() || undefined,
    dayRate: body?.dayRate as number,
    locale,
  })

  const companyName = getCompanySummary(companyId)?.name ?? 'Creative Filmmaking'
  const emailPromise = inviteToken
    ? sendPortalInviteEmail({
        email: member.email,
        name: member.name,
        locale: member.locale,
        companyName,
        jobName: job.name,
        token: inviteToken,
      })
    : sendAddedToJobEmail({ email: member.email, locale: member.locale, companyName, jobName: job.name })
  await emailPromise.catch(e => console.error('[portal] member email failed:', e))

  return member
})
