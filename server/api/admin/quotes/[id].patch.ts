import type { QuoteStatus } from '~~/app/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ status?: QuoteStatus }>(event)

  if (!body?.status || !QUOTE_STATUSES.includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }
  if (!setQuoteStatus(id, body.status)) {
    throw createError({ statusCode: 404, statusMessage: 'Quote not found' })
  }
  return { ok: true }
})
