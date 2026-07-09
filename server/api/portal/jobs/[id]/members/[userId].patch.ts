import type { JobMemberStatus } from '~~/app/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireJobAdmin(event, id)
  const userId = getRouterParam(event, 'userId')!

  const body = await readBody<{
    dayRate?: number, status?: JobMemberStatus
    departmentId?: string | null, isDeptAdmin?: boolean
  }>(event)
  const status = body?.status
  if (status !== undefined && !['active', 'removed'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }
  if (!updateMember(id, userId, {
    dayRate: body?.dayRate,
    status,
    departmentId: body?.departmentId,
    isDeptAdmin: body?.isDeptAdmin,
  })) {
    throw createError({ statusCode: 404, statusMessage: 'Member not found' })
  }
  return { ok: true }
})
