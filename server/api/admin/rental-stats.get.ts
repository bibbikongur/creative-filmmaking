import type { CartItemType } from '~~/app/types'

// GET /api/admin/rental-stats            → { summary, items[] } over every confirmed offer
// GET /api/admin/rental-stats?type=&id=  → { item } for one catalogue entry (null if never rented)
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const q = getQuery(event)
  const type = typeof q.type === 'string' ? q.type : ''
  const id = typeof q.id === 'string' ? q.id : ''

  if (type || id) {
    if (!['vehicle', 'equipment', 'service'].includes(type) || !id) {
      throw createError({ statusCode: 400, statusMessage: 'Expected type=vehicle|equipment|service and id' })
    }
    return { item: await getItemRentalStats(type as CartItemType, id) }
  }
  return getRentalStats()
})
