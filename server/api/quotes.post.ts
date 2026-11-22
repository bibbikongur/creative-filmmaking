import type { CartEntry, QuotePayload } from '~~/app/types'
import type { NewQuoteInput } from '~~/server/utils/quoteStore'

// Public cart submission → persisted quote request + notification email to
// the owner. The quote is saved BEFORE the email is attempted: a request must
// never be lost to an SMTP hiccup — it stays visible under /admin/quotes.

const isRateLimited = makeRateLimiter(60_000, 5)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const raw = await readBody<QuotePayload>(event).catch(() => null)
  if (!raw || typeof raw !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid submission' })
  }

  // Honeypot filled → a bot. Pretend success so it doesn't adapt.
  if (raw.website) {
    return { ok: true }
  }

  // One-line text fields: strings only, control characters out, length capped.
  const line = (v: unknown, max: number) =>
    // eslint-disable-next-line no-control-regex
    typeof v === 'string' ? v.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim().slice(0, max) : ''
  const body = {
    items: raw.items,
    locale: raw.locale,
    phone: line(raw.phone, 60),
    company: line(raw.company, 200),
    dates: line(raw.dates, 200),
  }
  const name = line(raw.name, 201)
  const email = line(raw.email, 201)
  const message = typeof raw.message === 'string' ? raw.message.trim() : ''

  if (!name || !email || !EMAIL_RE.test(email) || email.length > 200
    || name.length > 200 || message.length > 5000
    || !Array.isArray(body.items) || !body.items.length) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid submission' })
  }

  const ip = getClientIp(event)
  if (isRateLimited(ip) || publicFormsFlooded()) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  // Resolve items server-side — names/images are snapshotted from the
  // catalogue, never trusted from the client. Unknown ids are dropped. There
  // is no item limit: duplicates collapse, so the catalogue bounds the quote.
  const [vehicles, equipment] = await Promise.all([getVehicles(), getEquipment()])
  const items: NewQuoteInput['items'] = []
  const seen = new Set<string>()
  for (const raw of body.items as CartEntry[]) {
    // Capped: an uncapped (or infinite) quantity would flow into offer totals.
    const qty = Math.min(999, Math.max(1, Math.round(Number(raw?.qty)) || 1))
    const key = `${raw?.type}:${raw?.id}`
    if (seen.has(key)) continue
    seen.add(key)
    if (raw?.type === 'vehicle') {
      const v = vehicles.find(x => x.id === raw.id)
      if (v) {
        items.push({
          itemType: 'vehicle', itemId: v.id, slug: v.slug,
          nameEn: v.name.en, nameIs: v.name.is || v.name.en,
          // One of each, except where the fleet has several identical units.
          image: v.images[0], qty: Math.min(qty, Math.max(1, v.specs.units ?? 1)),
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
    throw createError({ statusCode: 400, statusMessage: 'Invalid submission' })
  }

  const quote = createQuote({
    locale: body.locale === 'is' ? 'is' : 'en',
    name,
    email,
    phone: body.phone?.trim() || undefined,
    company: body.company?.trim() || undefined,
    dates: body.dates?.trim() || undefined,
    message: message || undefined,
    items,
  })

  // Owner notification — best-effort now that the quote is durable.
  const siteUrl = (useRuntimeConfig().public.siteUrl || '').replace(/\/$/, '')
  const itemLines = items.map(i =>
    `- ${i.qty} × ${i.nameEn}${i.slug && siteUrl ? ` - ${siteUrl}/vehicles/${i.slug}` : ''}`)
  const lines = [
    `Name:       ${name}`,
    `Email:      ${email}`,
    `Phone:      ${quote.phone || '–'}`,
    `Company:    ${quote.company || '–'}`,
    `Dates:      ${quote.dates || '–'}`,
    `Language:   ${quote.locale === 'is' ? 'Icelandic' : 'English'}`,
    '',
    `Requested items (${items.length}):`,
    ...itemLines,
    '',
    'Message:',
    quote.message || '–',
    '',
    `Make an offer: ${siteUrl}/admin/quotes/${quote.id}`,
  ].join('\n')

  const mailer = getMailer()
  if (!mailer.isConfigured) {
    console.log('[quotes] SMTP not configured — quote request stored as ' + quote.id + ':\n' + lines)
    return { ok: true, id: quote.id }
  }

  try {
    await mailer.createTransport().sendMail({
      from: `"Creative Filmmaking" <${mailer.fromAddress}>`,
      to: mailer.contactTo,
      replyTo: { name, address: email },
      subject: `[Creative Filmmaking] Quote request: ${name}${quote.company ? ` · ${quote.company}` : ''} (${items.length} items)`,
      text: lines,
    })
  }
  catch (error) {
    // The quote is already stored and visible in the admin — don't fail the visitor.
    console.error(`[quotes] Failed to send notification email for ${quote.id}:`, error)
  }

  return { ok: true, id: quote.id }
})
