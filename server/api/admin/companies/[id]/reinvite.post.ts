export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const company = getCompanySummary(id)
  if (!company) throw createError({ statusCode: 404, statusMessage: 'Company not found' })

  const result = reinviteCompanyAdmin(id)
  if (!result) {
    throw createError({ statusCode: 409, statusMessage: 'The company admin has already activated their account.' })
  }

  await sendPortalInviteEmail({
    email: result.email,
    name: result.name,
    locale: result.locale,
    companyName: company.name,
    token: result.token,
  }).catch(e => console.error('[admin] company reinvite email failed:', e))

  return { ok: true }
})
