import type { CartEntry, LocaleCode, QuoteStatus } from '~~/app/types'
import type { UpdateQuoteInput } from '~~/server/utils/quoteStore'

// Two patch shapes on one endpoint:
//   { status }                     → status change only
//   { email, items, … }            → full edit of recipient details and items.
// Quotes stay editable even after an offer went out — every offer keeps its
// own item snapshot, so history and already-sent PDFs are unaffected.

interface PatchBody {
  status?: QuoteStatus
  email?: string
  name?: string
  company?: string
  phone?: string
  dates?: string
  locale?: LocaleCode
  items?: CartEntry[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_ITEMS = 40

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<PatchBody>(event)

  if (body?.status !== undefined) {
    if (!QUOTE_STATUSES.includes(body.status)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
    }
    if (!setQuoteStatus(id, body.status)) {
      throw createError({ statusCode: 404, statusMessage: 'Quote not found' })
    }
    return { ok: true }
  }

  const existing = getQuote(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Quote not found' })
  }

  const email = body.email?.trim()
  const errors: string[] = []
  if (!email || !EMAIL_RE.test(email)) errors.push('A valid recipient email is required.')
  if (!Array.isArray(body.items) || !body.items.length) errors.push('Pick at least one item.')
  else if (body.items.length > MAX_ITEMS) errors.push(`A quote can hold at most ${MAX_ITEMS} items.`)
  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors } })
  }

  const [vehicles, equipment] = await Promise.all([getVehicles(), getEquipment()])
  const prevByKey = new Map(existing.items.map(i => [`${i.itemType}:${i.itemId}`, i]))
  const items: UpdateQuoteInput['items'] = []
  const seen = new Set<string>()
  for (const raw of body.items!) {
    const qty = Math.max(1, Math.round(Number(raw?.qty)) || 1)
    const key = `${raw?.type}:${raw?.id}`
    if (seen.has(key)) continue
    seen.add(key)
    if (raw?.type === 'vehicle') {
      const v = vehicles.find(x => x.id === raw.id)
      if (v) {
        items.push({
          itemType: 'vehicle', itemId: v.id, slug: v.slug,
          nameEn: v.name.en, nameIs: v.name.is || v.name.en,
          image: v.images[0], qty,
        })
        continue
      }
    }
    else if (raw?.type === 'equipment') {
      const e = equipment.find(x => x.id === raw.id)
      if (e) {
        items.push({
          itemType: 'equipment', itemId: e.id,
          nameEn: e.name.en, nameIs: e.name.is || e.name.en,
          image: e.images[0], qty,
        })
        continue
      }
    }
    // Not in the catalogue anymore but already on this quote → keep its snapshot.
    const prev = prevByKey.get(key)
    if (prev) {
      items.push({
        itemType: prev.itemType, itemId: prev.itemId, slug: prev.slug,
        nameEn: prev.name.en, nameIs: prev.name.is, image: prev.image, qty,
      })
    }
  }
  if (!items.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: ['None of the selected items exist in the catalogue anymore.'] },
    })
  }

  updateQuote(id, {
    locale: body.locale === 'is' ? 'is' : 'en',
    name: body.name?.trim() || '',
    email: email!,
    phone: body.phone?.trim() || undefined,
    company: body.company?.trim() || undefined,
    dates: body.dates?.trim() || undefined,
    items,
  })

  return { ok: true }
})
