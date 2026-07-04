import { randomBytes } from 'node:crypto'
import type {
  CartItemType, DiscountType, LocaleCode, Offer, OfferCurrency, OfferItem,
  Quote, QuoteDetail, QuoteItem, QuoteStatus, QuoteSummary,
} from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Quote requests & offers — SQLite-backed (see db.ts). Quote items snapshot
// the catalogue name/image/slug at submit time so history and PDFs keep
// working after a vehicle is edited or deleted. Offers are append-only
// revisions; totals are always computed server-side.
// ─────────────────────────────────────────────────────────────────────────────

export const QUOTE_STATUSES: QuoteStatus[] = ['new', 'offered', 'won', 'lost']

export interface NewQuoteInput {
  locale: LocaleCode
  name: string
  email: string
  phone?: string
  company?: string
  dates?: string
  message?: string
  items: {
    itemType: CartItemType
    itemId: string
    slug?: string
    nameEn: string
    nameIs: string
    image?: string
    qty: number
  }[]
}

export interface NewOfferInput {
  currency: OfferCurrency
  discountType?: DiscountType
  discountValue?: number
  note?: string
  validUntil?: string
  items: { quoteItemId: number, unitPrice: number }[]
}

export function createQuote(input: NewQuoteInput): Quote {
  const db = getDb()
  const id = `q-${Date.now().toString(36)}${randomBytes(2).toString('hex')}`
  const createdAt = new Date().toISOString()

  const insertItem = db.prepare(`
    INSERT INTO quote_items (quote_id, item_type, item_id, slug, name_en, name_is, image, qty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  db.transaction(() => {
    db.prepare(`
      INSERT INTO quotes (id, created_at, status, locale, name, email, phone, company, dates, message)
      VALUES (?, ?, 'new', ?, ?, ?, ?, ?, ?, ?)
    `).run(id, createdAt, input.locale, input.name, input.email,
      input.phone ?? null, input.company ?? null, input.dates ?? null, input.message ?? null)
    for (const item of input.items) {
      insertItem.run(id, item.itemType, item.itemId, item.slug ?? null,
        item.nameEn, item.nameIs, item.image ?? null, item.qty)
    }
  })()

  return getQuote(id)!
}

export function listQuotes(): QuoteSummary[] {
  const rows = getDb().prepare(`
    SELECT q.*,
      (SELECT COUNT(*) FROM quote_items i WHERE i.quote_id = q.id) AS item_count,
      (SELECT o.sent_at  FROM offers o WHERE o.quote_id = q.id AND o.sent_at IS NOT NULL ORDER BY o.id DESC LIMIT 1) AS last_offer_at,
      (SELECT o.total    FROM offers o WHERE o.quote_id = q.id AND o.sent_at IS NOT NULL ORDER BY o.id DESC LIMIT 1) AS last_offer_total,
      (SELECT o.currency FROM offers o WHERE o.quote_id = q.id AND o.sent_at IS NOT NULL ORDER BY o.id DESC LIMIT 1) AS last_offer_currency
    FROM quotes q
    ORDER BY q.created_at DESC
  `).all() as Record<string, unknown>[]
  return rows.map(r => ({
    ...rowToQuote(r),
    itemCount: r.item_count as number,
    lastOfferAt: (r.last_offer_at as string | null) ?? undefined,
    lastOfferTotal: (r.last_offer_total as number | null) ?? undefined,
    lastOfferCurrency: (r.last_offer_currency as string | null) ?? undefined,
  }))
}

export function getQuote(id: string): QuoteDetail | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return null

  const items = (db.prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY id').all(id) as Record<string, unknown>[])
    .map(rowToQuoteItem)
  const offers = (db.prepare('SELECT * FROM offers WHERE quote_id = ? ORDER BY id').all(id) as Record<string, unknown>[])
    .map(rowToOffer)

  return { ...rowToQuote(row), items, offers }
}

export function setQuoteStatus(id: string, status: QuoteStatus): boolean {
  return getDb().prepare('UPDATE quotes SET status = ? WHERE id = ?').run(status, id).changes > 0
}

export function deleteQuote(id: string): boolean {
  return getDb().prepare('DELETE FROM quotes WHERE id = ?').run(id).changes > 0
}

/**
 * Create a new offer revision for a quote. Prices come per quote item; the
 * item snapshot (name/image/qty) is copied from quote_items and the totals
 * are computed here — never trusted from the client.
 */
export function createOffer(quoteId: string, input: NewOfferInput): Offer {
  const db = getDb()
  const quote = getQuote(quoteId)
  if (!quote) throw createError({ statusCode: 404, statusMessage: 'Quote not found' })

  const priceByItem = new Map(input.items.map(i => [i.quoteItemId, i.unitPrice]))
  const items: OfferItem[] = quote.items.map((qi) => {
    const unitPrice = priceByItem.get(qi.id)
    if (unitPrice === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: [`Missing price for item "${qi.name.en}".`] },
      })
    }
    return {
      quoteItemId: qi.id,
      name: qi.name,
      image: qi.image,
      qty: qi.qty,
      unitPrice,
      lineTotal: round2(unitPrice * qi.qty),
    }
  })

  const subtotal = round2(items.reduce((sum, i) => sum + i.lineTotal, 0))
  let discountAmount = 0
  if (input.discountType === 'percent' && input.discountValue) {
    discountAmount = round2(subtotal * Math.min(input.discountValue, 100) / 100)
  }
  else if (input.discountType === 'fixed' && input.discountValue) {
    discountAmount = round2(Math.min(input.discountValue, subtotal))
  }
  const total = round2(subtotal - discountAmount)
  const createdAt = new Date().toISOString()

  const result = db.prepare(`
    INSERT INTO offers (quote_id, created_at, currency, discount_type, discount_value,
                        note, valid_until, items, subtotal, discount_amount, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(quoteId, createdAt, input.currency,
    input.discountType ?? null, input.discountType ? input.discountValue ?? null : null,
    input.note ?? null, input.validUntil ?? null,
    JSON.stringify(items), subtotal, discountAmount, total)

  return getOffer(quoteId, Number(result.lastInsertRowid))!
}

export function getOffer(quoteId: string, offerId: number): Offer | null {
  const row = getDb().prepare('SELECT * FROM offers WHERE id = ? AND quote_id = ?')
    .get(offerId, quoteId) as Record<string, unknown> | undefined
  return row ? rowToOffer(row) : null
}

export function markOfferSent(offerId: number) {
  getDb().prepare('UPDATE offers SET sent_at = ? WHERE id = ?')
    .run(new Date().toISOString(), offerId)
}

// ── Row mappers ──────────────────────────────────────────────────────────────

function rowToQuote(r: Record<string, unknown>): Quote {
  return {
    id: r.id as string,
    createdAt: r.created_at as string,
    status: r.status as QuoteStatus,
    locale: r.locale as LocaleCode,
    name: r.name as string,
    email: r.email as string,
    phone: (r.phone as string | null) ?? undefined,
    company: (r.company as string | null) ?? undefined,
    dates: (r.dates as string | null) ?? undefined,
    message: (r.message as string | null) ?? undefined,
  }
}

function rowToQuoteItem(r: Record<string, unknown>): QuoteItem {
  return {
    id: r.id as number,
    itemType: r.item_type as CartItemType,
    itemId: r.item_id as string,
    slug: (r.slug as string | null) ?? undefined,
    name: { en: r.name_en as string, is: (r.name_is as string) || (r.name_en as string) },
    image: (r.image as string | null) ?? undefined,
    qty: r.qty as number,
  }
}

function rowToOffer(r: Record<string, unknown>): Offer {
  return {
    id: r.id as number,
    quoteId: r.quote_id as string,
    createdAt: r.created_at as string,
    sentAt: (r.sent_at as string | null) ?? undefined,
    currency: r.currency as OfferCurrency,
    discountType: (r.discount_type as DiscountType | null) ?? undefined,
    discountValue: (r.discount_value as number | null) ?? undefined,
    note: (r.note as string | null) ?? undefined,
    validUntil: (r.valid_until as string | null) ?? undefined,
    items: JSON.parse(r.items as string) as OfferItem[],
    subtotal: r.subtotal as number,
    discountAmount: r.discount_amount as number,
    total: r.total as number,
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100
