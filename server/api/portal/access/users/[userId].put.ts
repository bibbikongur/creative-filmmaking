// Set which helper tools a user may use. Body: { tools: string[] | null }
// (null restores the default: every tool). Only company admins may call it,
// and only for members of their own companies' jobs. Fellow company admins
// always have full access, so restricting them is rejected outright.
export default defineEventHandler(async (event) => {
  const { companyIds } = await requireAnyCompanyAdmin(event)

  const userId = getRouterParam(event, 'userId') ?? ''
  if (!adminManagesUser(companyIds, userId)) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }
  if (isAnyCompanyAdmin(userId)) {
    throw createError({ statusCode: 400, statusMessage: 'Company admins always have full access' })
  }

  const body = await readBody<{ tools?: unknown }>(event).catch(() => ({} as Record<string, unknown>))
  const tools = body?.tools === null ? null : sanitizeToolSlugs(body?.tools)
  setToolAccess(userId, tools)
  return { ok: true, tools }
})
