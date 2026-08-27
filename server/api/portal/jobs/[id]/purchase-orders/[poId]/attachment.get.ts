import { promises as fs } from 'node:fs'

// Stream an order's receipt attachment. Auth-gated and access-scoped: dept
// admins only reach orders in their own department; files are private
// (deliberately not under the public /uploads route).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const poId = getRouterParam(event, 'poId')!
  const ctx = await requirePurchaseOrderAccess(event, id)

  const order = getPurchaseOrder(id, poId)
  if (!order || (!ctx.viewAll && !ctx.departmentIds.includes(order.departmentId ?? null))) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  const fileName = poAttachmentFile(id, poId)
  if (!fileName) throw createError({ statusCode: 404, statusMessage: 'No attachment.' })

  const data = await fs.readFile(poAttachmentPath(fileName)).catch(() => null)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Attachment file is missing.' })

  setResponseHeaders(event, {
    'content-type': poAttachmentMime(fileName),
    'cache-control': 'no-store',
  })
  return data
})
