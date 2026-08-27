// Send (or resend) the job's contract/NDA to a crew member for built-in
// signing. The member gets an emailed link to the public signing page; no
// portal account is needed. Resending invalidates the previous link.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const { user } = await requireJobAdmin(event, id)
  const userId = getRouterParam(event, 'userId')!
  const kind = parseDocKind(getRouterParam(event, 'kind'))

  const job = getJob(id)!
  if (job.status !== 'active') {
    throw createError({ statusCode: 409, statusMessage: 'This job is closed.' })
  }

  const member = listMembers(id).find(m => m.userId === userId)
  if (!member || member.memberStatus !== 'active') {
    throw createError({ statusCode: 409, statusMessage: 'This person is not an active member of the job.' })
  }

  const template = getTemplate(id, kind)
  if (!template) {
    throw createError({ statusCode: 409, statusMessage: 'Upload a template first.' })
  }
  if (!template.fields.some(f => f.type === 'signature')) {
    throw createError({ statusCode: 409, statusMessage: 'Place a signature field before sending.' })
  }

  const { doc, token } = createSigningRequest({ jobId: id, userId, kind, sentBy: user.id })

  const companyName = getCompanySummary(job.companyId)?.name ?? 'Creative Filmmaking'
  await sendSignRequestEmail({
    email: member.email,
    name: member.name,
    locale: member.locale,
    companyName,
    jobName: job.name,
    kind,
    token,
  }).catch(e => console.error('[portal] sign-request email failed:', e))

  return doc
})
