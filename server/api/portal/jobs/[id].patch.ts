import type { JobStatus } from '~~/app/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireJobAdmin(event, id)

  const body = await readBody<{ name?: string, status?: JobStatus }>(event)
  const status = body?.status
  if (status !== undefined && !['active', 'closed'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }
  updateJob(id, { name: body?.name, status })
  return { ok: true }
})
