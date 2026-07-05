export default defineEventHandler(async (event) => {
  const { companyIds } = await requireAnyCompanyAdmin(event)
  const body = await readBody<{ name?: string, companyId?: string }>(event)

  // Admins of a single company (the normal case) don't need to pass companyId.
  const companyId = body?.companyId || (companyIds.length === 1 ? companyIds[0]! : '')
  if (!companyId || !companyIds.includes(companyId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid company' })
  }
  return createJob(companyId, String(body?.name ?? ''))
})
