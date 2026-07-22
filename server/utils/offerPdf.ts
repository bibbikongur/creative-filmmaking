import PDFDocument from 'pdfkit'
import { promises as fs } from 'node:fs'
import { basename, join, normalize, resolve } from 'node:path'
import type { LocaleCode, Offer, Quote } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Offer PDF — generated from the stored offer snapshot, so it can be
// regenerated (admin preview/download) at any time. pdfkit only: no headless
// browser. Built-in Helvetica covers Icelandic (ð/þ/æ/ö are WinAnsi).
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = '#A87A1F' // gold-600 — readable on white, matches the site accent
const INK = '#1A1A1F'
const GRAY = '#6B6B74'
const LINE = '#DDDAD2'

const STRINGS = {
  en: {
    title: 'OFFER',
    offerNo: 'Offer no.',
    date: 'Date',
    preparedFor: 'Prepared for',
    dates: 'Shooting dates',
    item: 'Item',
    qty: 'Qty',
    unitPrice: 'Unit price',
    lineTotal: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    vat: 'VAT',
    total: 'Total',
    totalInclVat: 'Total incl. VAT',
    validUntil: 'Valid until',
    accept: 'To accept this offer, or to discuss it, simply reply to the email it arrived with.',
    vatNote: 'All prices are without VAT unless otherwise stated.',
    vatNoteItemized: (rate: number) => `Item prices are without VAT. ${rate}% VAT is itemized above.`,
    perDay: (days: number, rate: string) => `${rate}/day × ${days} ${days === 1 ? 'day' : 'days'}`,
    perWeek: (weeks: number, rate: string) => `${rate}/week × ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`,
  },
  is: {
    title: 'TILBOÐ',
    offerNo: 'Tilboð nr.',
    date: 'Dagsetning',
    preparedFor: 'Tilboð fyrir',
    dates: 'Tökudagar',
    item: 'Liður',
    qty: 'Fj.',
    unitPrice: 'Einingarverð',
    lineTotal: 'Samtals',
    subtotal: 'Millisamtala',
    discount: 'Afsláttur',
    vat: 'VSK',
    total: 'Samtals',
    totalInclVat: 'Samtals með VSK',
    validUntil: 'Gildir til',
    accept: 'Til að samþykkja tilboðið, eða ræða það nánar, er nóg að svara tölvupóstinum sem það fylgdi.',
    vatNote: 'Öll verð eru án VSK nema annað sé tekið fram.',
    vatNoteItemized: (rate: number) => `Einingaverð eru án VSK. ${rate}% VSK er sundurliðaður að ofan.`,
    perDay: (days: number, rate: string) => `${rate}/dag × ${days} ${days === 1 ? 'dagur' : 'dagar'}`,
    perWeek: (weeks: number, rate: string) => `${rate}/viku × ${weeks} ${weeks === 1 ? 'vika' : 'vikur'}`,
  },
} as const

export function formatMoney(amount: number, currency: 'ISK' | 'EUR', locale: LocaleCode): string {
  const formatted = new Intl.NumberFormat(locale === 'is' ? 'is-IS' : 'en-US', {
    minimumFractionDigits: currency === 'ISK' ? 0 : 2,
    maximumFractionDigits: currency === 'ISK' ? 0 : 2,
  }).format(amount)
  return currency === 'ISK' ? `${formatted} kr.` : `€${formatted}`
}

/** Load image bytes for a thumbnail. pdfkit supports JPEG/PNG only — anything
 *  else (webp/avif uploads, failed fetches) returns null and the row renders
 *  without a picture. Never throws. */
async function loadPdfImage(src?: string): Promise<Buffer | null> {
  if (!src) return null
  try {
    let buf: Buffer
    if (src.startsWith('/uploads/')) {
      buf = await fs.readFile(join(uploadsDir(), basename(src)))
    }
    else if (/^https?:\/\//.test(src)) {
      const res = await fetch(src, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) return null
      buf = Buffer.from(await res.arrayBuffer())
    }
    else if (src.startsWith('/')) {
      buf = await readPublicAsset(src)
    }
    else {
      return null
    }
    const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47
    return (isJpeg || isPng) ? buf : null
  }
  catch {
    return null
  }
}

/** Read a catalogue image (e.g. /images/vehicles/x.jpg) from the public asset
 *  dir — public/ in dev, .output/public in the built server. */
async function readPublicAsset(src: string): Promise<Buffer> {
  const rel = normalize(decodeURIComponent(src.split('?')[0]!)).replace(/^[/\\]+/, '')
  for (const dir of [join(process.cwd(), 'public'), join(process.cwd(), '.output', 'public')]) {
    const path = resolve(dir, rel)
    if (!path.startsWith(resolve(dir))) continue // no escaping the asset dir
    try {
      return await fs.readFile(path)
    }
    catch { /* try the next candidate dir */ }
  }
  throw new Error(`public asset not found: ${src}`)
}

export async function generateOfferPdf(quote: Quote, offer: Offer): Promise<Buffer> {
  const locale = quote.locale
  const s = STRINGS[locale]
  const contact = useRuntimeConfig().public.contact as { address: string, phone: string, email: string }
  const money = (n: number) => formatMoney(n, offer.currency, locale)

  // Thumbnails are fetched up front so the PDF assembly itself is synchronous.
  const thumbs = await Promise.all(offer.items.map(i => loadPdfImage(i.image)))

  const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `${s.title} ${offer.quoteId}` } })
  const chunks: Buffer[] = []
  doc.on('data', c => chunks.push(c))
  const done = new Promise<Buffer>(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))))

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const width = right - left

  // ── Header band ────────────────────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(16).fillColor(INK)
    .text('CREATIVE', left, 50, { continued: true })
    .fillColor(GOLD).text(' FILMMAKING')
  doc.font('Helvetica').fontSize(8).fillColor(GRAY)
  doc.text(contact.address, left, 52, { width, align: 'right' })
  doc.text(contact.phone, { width, align: 'right' })
  doc.text(contact.email, { width, align: 'right' })

  doc.moveTo(left, 92).lineTo(right, 92).lineWidth(1).strokeColor(GOLD).stroke()

  // ── Title + meta ───────────────────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(24).fillColor(INK).text(s.title, left, 110)
  const offerNumber = `${offer.quoteId.toUpperCase()}-${offer.id}`
  const issued = new Date(offer.createdAt)
  const dateStr = issued.toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  doc.font('Helvetica').fontSize(9).fillColor(GRAY)
  doc.text(`${s.offerNo} ${offerNumber}`, left, 118, { width, align: 'right' })
  doc.text(`${s.date} ${dateStr}`, { width, align: 'right' })

  // ── Customer block ─────────────────────────────────────────────────────────
  let y = 160
  doc.font('Helvetica').fontSize(8).fillColor(GRAY).text(s.preparedFor.toUpperCase(), left, y)
  y += 12
  doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(quote.name || quote.email, left, y)
  y += 15
  doc.font('Helvetica').fontSize(9).fillColor(GRAY)
  for (const line of [quote.company, quote.name ? quote.email : undefined, quote.phone].filter(Boolean) as string[]) {
    doc.text(line, left, y)
    y += 12
  }
  if (quote.dates) {
    doc.text(`${s.dates}: ${quote.dates}`, left, y)
    y += 12
  }
  y += 16

  // ── Item table ─────────────────────────────────────────────────────────────
  const col = {
    thumb: left,
    name: left + 66,
    qty: right - 190,
    unit: right - 150,
    total: right - 70,
  }
  const thumbW = 54
  const thumbH = 36

  const tableHeader = () => {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(GRAY)
    doc.text(s.item.toUpperCase(), col.name, y)
    doc.text(s.qty.toUpperCase(), col.qty, y, { width: 30, align: 'right' })
    doc.text(s.unitPrice.toUpperCase(), col.unit, y, { width: 70, align: 'right' })
    doc.text(s.lineTotal.toUpperCase(), col.total, y, { width: 70, align: 'right' })
    y += 14
    doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor(LINE).stroke()
    y += 10
  }
  tableHeader()

  offer.items.forEach((item, idx) => {
    const rowH = thumbH + 12
    if (y + rowH > doc.page.height - 140) {
      doc.addPage()
      y = doc.page.margins.top
      tableHeader()
    }
    const thumb = thumbs[idx]
    if (thumb) {
      try {
        doc.image(thumb, col.thumb, y, { fit: [thumbW, thumbH], align: 'center', valign: 'center' })
      }
      catch { /* corrupt image — skip the thumbnail */ }
    }
    const name = item.name[locale] || item.name.en
    const periodLine = item.pricing === 'day' && item.days
      ? s.perDay(item.days, money(item.unitPrice))
      : item.pricing === 'week' && item.weeks
        ? s.perWeek(item.weeks, money(item.unitPrice))
        : null
    // Per-period rows carry a second (gray) line, so the text block starts higher.
    const textY = periodLine ? y + (thumbH - 24) / 2 : y + (thumbH - 10) / 2 - 4
    doc.font('Helvetica-Bold').fontSize(10).fillColor(INK)
      .text(name, col.name, textY, { width: col.qty - col.name - 10, ellipsis: true, height: 12 })
    if (periodLine) {
      doc.font('Helvetica').fontSize(8).fillColor(GRAY)
        .text(periodLine, col.name, textY + 14,
          { width: col.qty - col.name - 10, ellipsis: true, height: 10 })
    }
    doc.font('Helvetica').fontSize(10).fillColor(INK)
    doc.text(String(item.qty), col.qty, textY, { width: 30, align: 'right' })
    doc.text(money(item.unitPrice), col.unit, textY, { width: 70, align: 'right' })
    doc.text(money(item.lineTotal), col.total, textY, { width: 70, align: 'right' })
    y += rowH
    doc.moveTo(left, y - 6).lineTo(right, y - 6).lineWidth(0.5).strokeColor(LINE).stroke()
  })

  // ── Totals ─────────────────────────────────────────────────────────────────
  if (y + 120 > doc.page.height - 90) {
    doc.addPage()
    y = doc.page.margins.top
  }
  y += 8
  const totalRow = (label: string, value: string, bold = false, color = INK) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10).fillColor(color)
    doc.text(label, col.qty - 60, y, { width: col.total - col.qty + 20, align: 'right' })
    doc.text(value, col.total, y, { width: 70, align: 'right' })
    y += bold ? 20 : 16
  }
  const vat = offer.vatAmount ?? 0
  if (offer.discountAmount > 0 || vat > 0) {
    totalRow(s.subtotal, money(offer.subtotal))
  }
  if (offer.discountAmount > 0) {
    const discountLabel = offer.discountType === 'percent'
      ? `${s.discount} (${offer.discountValue}%)`
      : s.discount
    // ASCII hyphen — the U+2212 minus sign is outside WinAnsi and won't render.
    totalRow(discountLabel, `-${money(offer.discountAmount)}`, false, GOLD)
  }
  if (vat > 0) {
    totalRow(`${s.vat} (${offer.vatRate}%)`, money(vat))
  }
  doc.moveTo(col.qty - 60, y).lineTo(right, y).lineWidth(1).strokeColor(INK).stroke()
  y += 8
  totalRow(vat > 0 ? s.totalInclVat : s.total, money(offer.total), true)

  // ── Note / validity / footer ───────────────────────────────────────────────
  y += 16
  if (offer.note) {
    doc.font('Helvetica').fontSize(9).fillColor(INK).text(offer.note, left, y, { width })
    y = doc.y + 12
  }
  if (offer.validUntil) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text(`${s.validUntil}: ${offer.validUntil}`, left, y, { width })
    y = doc.y + 12
  }
  doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(s.accept, left, y, { width })
  doc.text(vat > 0 ? s.vatNoteItemized(offer.vatRate) : s.vatNote, left, doc.y + 4, { width })

  doc.end()
  return done
}
