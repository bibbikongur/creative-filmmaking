import type { CartEntry, LocaleCode } from '~~/app/types'
import type { NewQuoteInput } from '~~/server/utils/quoteStore'

// Admin-created quote: the owner picks catalogue items and a recipient email,
// then prices and sends the offer from the regular quote detail page. Items
// are resolved server-side against the catalogue, same as the public cart.

interface AdminQuoteBody {
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
  const body = await readBody<AdminQuoteBody>(event)

  const email = body.email?.trim()
  const errors: string[] = []
  if (!email || !EMAIL_RE.test(email)) errors.push('A valid recipient email is required.')
  if (!Array.isArray(body.items) || !body.items.length) errors.push('Pick at least one item.')
  else if (body.items.length > MAX_ITEMS) errors.push(`A quote can hold at most ${MAX_ITEMS} items.`)

  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors } })
  }

  const [vehicles, equipment] = await Promise.all([getVehicles(), getEquipment()])
  const items: NewQuoteInput['items'] = []
  const seen = new Set<string>()
  for (const raw of body.items!) {
    const qty = Math.max(1, Math.min(Math.round(Number(raw?.qty)) || 1, 99))
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
      }
    }
  }
  if (!items.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: ['None of the selected items exist in the catalogue anymore.'] },
    })
  }

  const quote = createQuote({
    locale: body.locale === 'is' ? 'is' : 'en',
    source: 'admin',
    name: body.name?.trim() || '',
    email: email!,
    phone: body.phone?.trim() || undefined,
    company: body.company?.trim() || undefined,
    dates: body.dates?.trim() || undefined,
    items,
  })

  return { ok: true, id: quote.id }
})
