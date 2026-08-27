import type { JobMemberStatus } from '~~/app/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireJobAdmin(event, id)
  const userId = getRouterParam(event, 'userId')!

  const body = await readBody<{
    dayRate?: number, status?: JobMemberStatus
    departmentId?: string | null, isDeptAdmin?: boolean
    role?: string, phone?: string
    poRole?: 'none' | 'log' | 'log_all' | 'view' | 'approve' | null
    poDepartments?: string[] | null
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
    role: body?.role,
    phone: body?.phone,
    poRole: body?.poRole,
    poDepartments: body?.poDepartments,
  })) {
    throw createError({ statusCode: 404, statusMessage: 'Member not found' })
  }
  return { ok: true }
})
