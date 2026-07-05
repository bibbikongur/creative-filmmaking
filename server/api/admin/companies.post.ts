export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const input = parseCompanyPayload(await readBody(event))
  const { company, inviteToken } = createCompany(input)

  if (inviteToken) {
    await sendPortalInviteEmail({
      email: input.adminEmail,
      name: input.adminName,
      locale: input.locale,
      companyName: input.name,
      token: inviteToken,
    }).catch(e => console.error('[admin] company invite email failed:', e))
  }

  return company
})
