export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const { companyId } = await requireJobAdmin(event, id)
  const userId = getRouterParam(event, 'userId')!

  const member = listMembers(id).find(m => m.userId === userId)
  if (!member) throw createError({ statusCode: 404, statusMessage: 'Member not found' })

  const token = reissueInvite(userId)
  if (!token) {
    throw createError({ statusCode: 409, statusMessage: 'This member has already activated their account.' })
  }

  await sendPortalInviteEmail({
    email: member.email,
    name: member.name,
    locale: member.locale,
    companyName: getCompanySummary(companyId)?.name ?? 'Creative Filmmaking',
    jobName: getJob(id)!.name,
    token,
  }).catch(e => console.error('[portal] member reinvite email failed:', e))

  return { ok: true }
})
