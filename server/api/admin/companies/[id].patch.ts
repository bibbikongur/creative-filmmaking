import type { CompanyStatus } from '~~/app/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ name?: string, status?: CompanyStatus }>(event)

  const status = body?.status
  if (status !== undefined && !['active', 'disabled'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }
  if (!updateCompany(id, { name: body?.name, status })) {
    throw createError({ statusCode: 404, statusMessage: 'Company not found' })
  }
  return { ok: true }
})
