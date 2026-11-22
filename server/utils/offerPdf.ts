import PDFDocument from 'pdfkit'
import sharp from 'sharp'
import { promises as fs } from 'node:fs'
import { basename, join, normalize, resolve } from 'node:path'
import type { LocaleCode, Offer, OfferItem, OfferItemExtra, Quote } from '~~/app/types'
import { INSURANCE_EXCESS } from '~~/app/data/insurance'
import { discountedLines } from './offerDiscount'

// ─────────────────────────────────────────────────────────────────────────────
// Offer PDF — generated from the stored offer snapshot, so it can be
// regenerated (admin preview/download) at any time. pdfkit only: no headless
// browser. Built-in Helvetica covers Icelandic (ð/þ/æ/ö are WinAnsi).
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = '#A87A1F' // gold-600: readable on white, matches the site accent
const INK = '#1A1F26'
const GRAY = '#5F6872'
const MUTED = '#8A929B'
const LINE = '#DCD9D2'
const PANEL = '#F6F4EF' // warm paper tint for panels and the table head

const STRINGS = {
  en: {
    title: 'Offer',
    offerNo: 'Offer no.',
    date: 'Date',
    preparedFor: 'Prepared for',
    details: 'Offer details',
    kennitala: 'Reg. no.',
    phone: 'Phone',
    dates: 'Rental period',
    item: 'Item',
    qty: 'Qty',
    rate: 'Price',
    period: 'Period',
    amount: 'Amount',
    subtotal: 'Subtotal',
    listSubtotal: 'Subtotal before discount',
    discount: 'Discount',
    vat: 'VAT',
    totalInclVat: 'Total incl. VAT',
    totalExclVat: 'Total excl. VAT',
    netExclVat: 'Net excl. VAT',
    validUntil: 'Valid until',
    notes: 'Notes',
    acceptTitle: 'To accept this offer',
    accept: 'Reply to the email this offer came with, or contact us below. We will then confirm your booking.',
    discountApplied: (pct: string) => `${pct}% off the subtotal`,
    vatNo: 'VAT no.',
    vatNote: 'No VAT is included in this offer.',
    vatNoteItemized: (rate: string) => `Item prices are without VAT; ${rate}% VAT is added above.`,
    perDay: '/day',
    perWeek: '/week',
    perKm: '/km',
    days: (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`,
    weeks: (n: number) => `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${n === 1 ? 'week' : 'weeks'}`,
    withExtras: 'Total with add-ons',
    tiers: { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' },
    insurance: (tier: string) => `${tier} insurance`,
    excess: (amount: string) => `Excess ${amount} per incident`,
    driver: (n: number) => n === 1 ? 'Additional driver' : 'Additional drivers',
    driversUnlimited: 'Unlimited authorised drivers',
    km: 'Kilometres',
    page: (n: number, of: number) => `Page ${n} of ${of}`,
    continued: 'continued',
  },
  is: {
    title: 'Tilboð',
    offerNo: 'Tilboð nr.',
    date: 'Dagsetning',
    preparedFor: 'Tilboð fyrir',
    details: 'Um tilboðið',
    kennitala: 'Kt.',
    phone: 'Sími',
    dates: 'Leigutími',
    item: 'Liður',
    qty: 'Fjöldi',
    rate: 'Verð',
    period: 'Tímabil',
    amount: 'Upphæð',
    subtotal: 'Millisamtala',
    listSubtotal: 'Millisamtala fyrir afslátt',
    discount: 'Afsláttur',
    vat: 'VSK',
    totalInclVat: 'Samtals með VSK',
    totalExclVat: 'Samtals án VSK',
    netExclVat: 'Nettó án VSK',
    validUntil: 'Gildir til',
    notes: 'Athugasemdir',
    acceptTitle: 'Til að samþykkja tilboðið',
    accept: 'Svaraðu tölvupóstinum sem tilboðið fylgdi, eða hafðu samband hér að neðan. Við staðfestum þá bókunina.',
    discountApplied: (pct: string) => `${pct}% af millisamtölu`,
    vatNo: 'VSK nr.',
    vatNote: 'VSK er ekki innifalinn í tilboðinu.',
    vatNoteItemized: (rate: string) => `Einingaverð eru án VSK; ${rate}% VSK bætist við hér að ofan.`,
    perDay: '/dag',
    perWeek: '/viku',
    perKm: '/km',
    days: (n: number) => `${n} ${n === 1 ? 'dagur' : 'dagar'}`,
    weeks: (n: number) => `${n.toLocaleString('is-IS', { maximumFractionDigits: 2 })} ${n === 1 ? 'vika' : 'vikur'}`,
    withExtras: 'Samtals með aukahlutum',
    tiers: { bronze: 'Brons', silver: 'Silfur', gold: 'Gull' },
    insurance: (tier: string) => `Trygging (${tier})`,
    excess: (amount: string) => `Sjálfsábyrgð ${amount} á hvert tjón`,
    driver: (n: number) => n === 1 ? 'Aukaökumaður' : 'Aukaökumenn',
    driversUnlimited: 'Ótakmarkaður fjöldi ökumanna',
    km: 'Kílómetrar',
    page: (n: number, of: number) => `Bls. ${n} af ${of}`,
    continued: 'framhald',
  },
} as const

export function formatMoney(amount: number, currency: 'ISK' | 'EUR', locale: LocaleCode): string {
  const formatted = new Intl.NumberFormat(locale === 'is' ? 'is-IS' : 'en-US', {
    minimumFractionDigits: currency === 'ISK' ? 0 : 2,
    maximumFractionDigits: currency === 'ISK' ? 0 : 2,
  }).format(amount)
  return currency === 'ISK' ? `${formatted} kr.` : `€${formatted}`
}

/** Load image bytes for the PDF. Never throws: anything that cannot be
 *  loaded returns null and the row renders without a picture.
 *
 *  Thumbnails are scaled down to what a 38pt frame needs at print resolution
 *  and re-encoded as JPEG, so a long offer stays a small email attachment and
 *  webp/avif uploads (which pdfkit cannot embed) get a picture too. If the
 *  resize fails, the original bytes are used when they are JPEG or PNG. */
async function loadPdfImage(src?: string, opts: { thumbnail?: boolean } = {}): Promise<Buffer | null> {
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
    if (opts.thumbnail) {
      try {
        return await sharp(buf, { limitInputPixels: 60_000_000 })
          .rotate()
          .resize({ width: 240, height: 180, fit: 'inside', withoutEnlargement: true })
          .flatten({ background: '#ffffff' })
          .jpeg({ quality: 82 })
          .toBuffer()
      }
      catch { /* fall through to the original bytes */ }
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
  const config = useRuntimeConfig().public as {
    siteUrl?: string
    contact: { address: string, phone: string, email: string, legalName?: string, kennitala?: string, vatNumber?: string }
  }
  const contact = config.contact
  const website = (config.siteUrl ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  const money = (n: number) => formatMoney(n, offer.currency, locale)
  const num = (n: number) => n.toLocaleString(locale === 'is' ? 'is-IS' : 'en-US', { maximumFractionDigits: 2 })

  // Images are fetched up front so the PDF assembly itself is synchronous.
  const [logo, ...thumbs] = await Promise.all([
    loadPdfImage('/logo-cf-rentals.png'),
    ...offer.items.map(i => loadPdfImage(i.image, { thumbnail: true })),
  ])

  const offerNumber = `${offer.quoteId.toUpperCase()}-${offer.id}`
  const doc = new PDFDocument({
    size: 'A4',
    // The bottom margin is handled by hand (footer band), so pdfkit never adds a page on its own.
    margins: { top: 44, left: 48, right: 48, bottom: 0 },
    bufferPages: true,
    info: { Title: `${s.title} ${offerNumber}`, Author: 'CF Rentals · Creative Filmmaking' },
  })
  const chunks: Buffer[] = []
  doc.on('data', c => chunks.push(c))
  const done = new Promise<Buffer>(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))))

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const width = right - left
  const top = doc.page.margins.top
  // Content never runs below this line; the two-line footer sits under it.
  const bottom = doc.page.height - 74
  // One page grid: a narrower left column and a wider right one. The panels,
  // the notes and the totals all sit on it. One inset for every right-aligned figure.
  const gap = 16
  const pad = 12
  const leftW = Math.round((width - gap) * 0.44)
  const rightW = width - gap - leftW
  const rightX = left + leftW + gap

  const label = (text: string, x: number, y: number, opts: PDFKit.Mixins.TextOptions = {}) =>
    doc.font('Helvetica-Bold').fontSize(7).fillColor(MUTED).text(text.toUpperCase(), x, y, { characterSpacing: 0.8, ...opts })
  const hairline = (y: number, color = LINE, w = 0.5, x1 = left, x2 = right) =>
    doc.moveTo(x1, y).lineTo(x2, y).lineWidth(w).strokeColor(color).stroke()

  // Receiver email is intentionally omitted from the PDF, including as a fallback
  // heading, so it never leaks when only the email is known.
  const customerName = quote.name || quote.company || ''

  // ── Letterhead ─────────────────────────────────────────────────────────────
  // Logo on the left; the document's name, number and date on the right.
  const issued = new Date(offer.createdAt)
  const dateStr = issued.toLocaleDateString(locale === 'is' ? 'is-IS' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  let logoDrawn = false
  if (logo) {
    try {
      doc.image(logo, left, top + 2, { height: 30 })
      logoDrawn = true
    }
    catch { /* fall through to the text wordmark */ }
  }
  if (!logoDrawn) {
    doc.font('Helvetica-Bold').fontSize(18).fillColor(INK).text('CF ', left, top + 8, { continued: true }).fillColor(GOLD).text('RENTALS')
  }
  doc.font('Helvetica-Bold').fontSize(22).fillColor(INK)
    .text(s.title.toUpperCase(), left, top - 3, { width, align: 'right', characterSpacing: 1.5 })
  doc.font('Helvetica').fontSize(9).fillColor(GRAY)
    .text(`${s.offerNo} ${offerNumber}`, left, top + 21, { width, align: 'right' })
    .text(`${s.date} ${dateStr}`, left, top + 33, { width, align: 'right' })
  let y = top + 54
  hairline(y, GOLD, 1.5)
  y += 18

  // ── Who it is for, and the terms of the rental ─────────────────────────────
  const customerLines = [
    // Company already used as the heading when there's no contact name: don't repeat it.
    quote.name ? quote.company : undefined,
    quote.kennitala ? `${s.kennitala} ${quote.kennitala}` : undefined,
    quote.phone ? `${s.phone} ${quote.phone}` : undefined,
  ].filter(Boolean) as string[]
  const hasCustomer = !!customerName || customerLines.length > 0
  // [label, value, emphasis]. The deadline is the one emphasised fact.
  const facts: [string, string, ('strong' | 'accent')?][] = [
    ...(quote.dates ? [[s.dates, quote.dates] as [string, string]] : []),
    ...(offer.validUntil ? [[s.validUntil, offer.validUntil, 'strong'] as [string, string, 'strong']] : []),
    // A percentage is worth stating up front; a fixed amount only makes sense in the sums.
    ...(offer.discountAmount > 0 && offer.discountType === 'percent'
      ? [[s.discount, s.discountApplied(num(offer.discountValue ?? 0)), 'accent'] as [string, string, 'accent']]
      : []),
  ]
  if (hasCustomer || facts.length) {
    // Both panels when there is something for each; otherwise the one that has content, full width.
    const both = hasCustomer && facts.length > 0
    const custW = both ? leftW : width
    const factsX = both ? rightX : left
    const factsW = both ? rightW : width
    const factLabelW = 76
    const factValueW = factsW - pad * 2 - factLabelW
    const custTextW = custW - pad * 2
    doc.font('Helvetica-Bold').fontSize(11)
    const nameH = customerName ? Math.min(40, doc.heightOfString(customerName, { width: custTextW })) : 0
    doc.font('Helvetica').fontSize(9)
    const lineHeights = customerLines.map(l => Math.min(22, doc.heightOfString(l, { width: custTextW })) + 2)
    const factHeights = facts.map(([, v, emphasis]) => {
      doc.font(emphasis === 'strong' ? 'Helvetica-Bold' : 'Helvetica').fontSize(9)
      return Math.max(11, doc.heightOfString(v, { width: factValueW })) + 5
    })
    const custH = hasCustomer ? 14 + (nameH ? nameH + 3 : 0) + lineHeights.reduce((a, h) => a + h, 0) - (lineHeights.length ? 2 : 3) : 0
    const factsH = facts.length ? 14 + factHeights.reduce((a, h) => a + h, 0) - 5 : 0
    const panelH = Math.max(custH, factsH) + pad * 2
    if (hasCustomer) {
      doc.rect(left, y, custW, panelH).fill(PANEL)
      label(s.preparedFor, left + pad, y + pad)
      let cy = y + pad + 14
      if (customerName) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(customerName, left + pad, cy, { width: custTextW, ellipsis: true, height: 41 })
        cy += nameH + 3
      }
      doc.font('Helvetica').fontSize(9).fillColor(GRAY)
      customerLines.forEach((line, i) => {
        doc.text(line, left + pad, cy, { width: custTextW, ellipsis: true, height: 22 })
        cy += lineHeights[i]!
      })
    }
    if (facts.length) {
      doc.rect(factsX, y, factsW, panelH).fill(PANEL)
      label(s.details, factsX + pad, y + pad)
      let fy = y + pad + 14
      facts.forEach(([k, v, emphasis], i) => {
        doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(k, factsX + pad, fy, { width: factLabelW - 6 })
        doc.font(emphasis === 'strong' ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(INK)
          .text(v, factsX + pad + factLabelW, fy, { width: factValueW })
        fy += factHeights[i]!
      })
    }
    y += panelH + 20
  }

  // ── Item table ─────────────────────────────────────────────────────────────
  // Item · qty · price · period · amount. The period column only exists when
  // something on the offer is priced per day or per week, and the qty column
  // is only as wide as the widest quantity on this offer.
  //
  // On a discounted offer every price and amount is the one the customer pays,
  // with the list figure struck through underneath it.
  const discounted = discountedLines(offer)
  const hasPeriod = offer.items.some(i => (i.pricing === 'day' && i.days) || (i.pricing === 'week' && i.weeks))
  const perUnit = (pricing: OfferItem['pricing']) => pricing === 'day' ? s.perDay : pricing === 'week' ? s.perWeek : ''
  const periodOf = (item: OfferItem) => item.pricing === 'day' && item.days
    ? s.days(item.days)
    : item.pricing === 'week' && item.weeks ? s.weeks(item.weeks) : ''
  const qtyText = (e: OfferItemExtra) => e.kind === 'km' ? `${num(e.qty)} km` : num(e.qty)
  // A discounted króna rate under 1,000 kr. keeps its aurar (45 kr./km less 10% is 40.5, not 41);
  // on anything larger they would only be noise.
  const rateMoney = (n: number) => offer.currency === 'ISK' && n < 1000 && !Number.isInteger(n) ? `${num(n)} kr.` : money(n)
  const rateText = (item: OfferItem, price = item.unitPrice) => `${rateMoney(price)}${perUnit(item.pricing)}`
  const extraRateText = (item: OfferItem, e: OfferItemExtra, price = e.unitPrice) => `${rateMoney(price)}${e.kind === 'km' ? s.perKm : perUnit(item.pricing)}`
  const groupTotal = (item: OfferItem) => item.lineTotal + (item.extras ?? []).reduce((sum, e) => sum + e.total, 0)
  const headW = (text: string) => doc.font('Helvetica-Bold').fontSize(7).widthOfString(text.toUpperCase(), { characterSpacing: 0.8 })
  const widest = (font: string, texts: string[]) => {
    doc.font(font).fontSize(9.5)
    return Math.max(0, ...texts.map(t => doc.widthOfString(t)))
  }
  const fit = (head: string, font: string, texts: string[]) => Math.ceil(Math.max(headW(head), widest(font, texts))) + 2
  const qtyW = fit(s.qty, 'Helvetica', offer.items.flatMap(i => [num(i.qty), ...(i.extras ?? []).map(qtyText)]))
  const rateW = fit(s.rate, 'Helvetica', offer.items.flatMap((i, n) => [
    rateText(i),
    ...(i.extras ?? []).map(e => extraRateText(i, e)),
    ...(discounted ? [rateText(i, discounted[n]!.unitPrice), ...(i.extras ?? []).map((e, k) => extraRateText(i, e, discounted[n]!.extras[k]!.unitPrice))] : []),
  ]))
  const periodW = hasPeriod ? fit(s.period, 'Helvetica', offer.items.map(periodOf)) : 0
  const inset = 8
  const amountW = fit(s.amount, 'Helvetica-Bold', offer.items.flatMap((i, n) => [
    money(i.lineTotal),
    money(groupTotal(i)),
    ...(discounted ? [money(discounted[n]!.lineTotal), money(discounted[n]!.groupTotal)] : []),
  ])) + inset
  const thumbW = 38
  const thumbH = 28
  const colGap = 14
  const col = {
    thumb: left,
    name: left + thumbW + 10,
    amount: right - amountW,
    period: right - amountW - (hasPeriod ? colGap + periodW : 0),
    rate: right - amountW - (hasPeriod ? colGap + periodW : 0) - colGap - rateW,
    qty: 0,
  }
  col.qty = col.rate - colGap - qtyW
  const nameW = col.qty - col.name - colGap
  // Notes sit under the name, where the figure cells are empty: they may run on to the amount column.
  const noteW = col.amount - col.name - colGap

  const tableHeader = (continued = false) => {
    doc.rect(left, y, width, 20).fill(PANEL)
    const hy = y + 7
    label(continued ? `${s.item} (${s.continued})` : s.item, left + inset, hy)
    label(s.qty, col.qty, hy, { width: qtyW, align: 'right' })
    label(s.rate, col.rate, hy, { width: rateW, align: 'right' })
    if (hasPeriod) label(s.period, col.period, hy, { width: periodW, align: 'right' })
    label(s.amount, col.amount, hy, { width: amountW - inset, align: 'right' })
    y += 20 + 8
  }
  // A continuation page says whose offer it is before the table carries on.
  const runningHead = () => {
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text(['CF Rentals', `${s.title} ${offerNumber}`, customerName].filter(Boolean).join('   ·   '), left, top, { width, height: 10, ellipsis: true })
    hairline(top + 14)
    y = top + 24
  }
  tableHeader()

  // Closing-block geometry is needed up front: the last table row reserves
  // room for the totals and the closing notes, so neither the grand total nor
  // the acceptance note ever sits alone on a page.
  const vat = offer.vatAmount ?? 0
  const hasDiscount = !!discounted
  const net = offer.subtotal - offer.discountAmount
  const totalsW = rightW
  const totalsX = rightX
  const notesW = leftW
  // The lines above already carry the discounted amounts, so the sums start from the list subtotal.
  const ledgerRows = (hasDiscount ? 2 : 0) + (vat > 0 ? 2 : 0)
  const vatNote = vat > 0 ? s.vatNoteItemized(num(offer.vatRate)) : s.vatNote
  const totalsH = (ledgerRows ? ledgerRows * 17 + 4 : 0) + 30 + 6 + 10
  doc.font('Helvetica').fontSize(9)
  const NOTE_MAX_H = 150
  const notesH = offer.note ? 13 + Math.min(NOTE_MAX_H, doc.heightOfString(offer.note, { width: notesW, lineGap: 1.5 })) : 0
  const acceptTextH = doc.heightOfString(s.accept, { width: width - 32 })
  const stripH = 11 + 13 + acceptTextH + (offer.validUntil ? 4 + 11 : 0) + 6 + 11 + 11
  const tailH = 14 + Math.max(totalsH, notesH) + 18 + stripH
  const ensureRoom = (need: number) => {
    if (y + need > bottom) {
      doc.addPage()
      runningHead()
      tableHeader(true)
    }
  }
  const cell = (text: string, x: number, w: number, textY: number, opts: { bold?: boolean, color?: string, size?: number, inset?: number, strike?: boolean } = {}) =>
    doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.size ?? 9.5).fillColor(opts.color ?? INK)
      .text(text, x - 40, textY, { width: w + 40 - (opts.inset ?? 0), align: 'right', lineBreak: false, strike: opts.strike })
  // The list figure a discounted one replaces: small, muted and struck through, right under it.
  const listCell = (text: string, x: number, w: number, textY: number, cellInset = 0) =>
    cell(text, x, w, textY, { size: 7.5, color: MUTED, strike: true, inset: cellInset })
  // Room the two-line figures need in an item row and in an add-on row.
  const figuresH = discounted ? 21 : 0
  const extraFiguresH = discounted ? 19 : 0
  const extraLabel = (e: OfferItemExtra) => e.kind === 'insurance'
    ? s.insurance(s.tiers[e.tier ?? 'bronze'])
    : e.kind === 'driver' ? (e.unlimited ? s.driversUnlimited : s.driver(e.qty)) : s.km

  offer.items.forEach((item, idx) => {
    const extras = item.extras ?? []
    const isLastItem = idx === offer.items.length - 1
    const name = item.name[locale] || item.name.en
    const note = item.note?.trim() || null
    doc.font('Helvetica-Bold').fontSize(10)
    const nameH = Math.min(37, doc.heightOfString(name, { width: nameW, lineGap: 0.5 }))
    doc.font('Helvetica').fontSize(8)
    // Under a one-line name the struck-through list figures sit beside the note, so it keeps to the name column.
    const itemNoteW = nameH < figuresH ? nameW : noteW
    // Up to four lines of note; only something longer than that is shortened.
    const noteH = note ? Math.min(42, doc.heightOfString(note, { width: itemNoteW, lineGap: 1 })) : 0
    const blockH = Math.max(nameH + (note ? 3 + noteH : 0), figuresH)
    const rowH = Math.max(thumbH, blockH)
    const line = discounted?.[idx]
    doc.font('Helvetica').fontSize(9)
    const extraLabelH = (e: OfferItemExtra) => Math.min(22, doc.heightOfString(extraLabel(e), { width: nameW - 10 }))
    const extraRowH = (e: OfferItemExtra) => 5 + Math.max(
      extraLabelH(e) + (e.kind === 'insurance' && INSURANCE_EXCESS[e.tier ?? 'bronze'] ? 10 : 0),
      extraFiguresH,
    )
    const groupRowH = discounted ? 29 : 20
    // Extras stay with their item; the last item also stays with the closing block.
    const extrasH = extras.reduce((h, e) => h + extraRowH(e), 0) + (extras.length ? 6 + groupRowH : 0)
    ensureRoom(rowH + extrasH + 16 + (isLastItem ? tailH : 0))

    // The photo sits in a hairline frame. No photo (a service, a new item): no frame, same indent.
    const thumb = thumbs[idx]
    if (thumb) {
      try {
        doc.image(thumb, col.thumb + 1, y + 1, { fit: [thumbW - 2, thumbH - 2], align: 'center', valign: 'center' })
        doc.rect(col.thumb + 0.25, y + 0.25, thumbW - 0.5, thumbH - 0.5).lineWidth(0.5).strokeColor(LINE).stroke()
      }
      catch { /* corrupt image: the row simply has no photo */ }
    }
    // One-line rows centre on the photo; taller text blocks start at its top.
    const textY = y + Math.max(0, (thumbH - blockH) / 2)
    doc.font('Helvetica-Bold').fontSize(10).fillColor(INK)
      .text(name, col.name, textY, { width: nameW, ellipsis: true, height: 39, lineGap: 0.5 })
    if (note) {
      doc.font('Helvetica').fontSize(8).fillColor(GRAY)
        .text(note, col.name, textY + nameH + 3, { width: itemNoteW, ellipsis: true, height: 42, lineGap: 1 })
    }
    cell(num(item.qty), col.qty, qtyW, textY)
    cell(rateText(item, line?.unitPrice), col.rate, rateW, textY)
    if (hasPeriod) cell(periodOf(item), col.period, periodW, textY, { color: GRAY })
    // Bold marks the figures that add up to the total: a plain line's amount, or a vehicle's total with add-ons.
    cell(money(line?.lineTotal ?? item.lineTotal), col.amount, amountW, textY, { bold: !extras.length, inset })
    if (line) {
      listCell(rateText(item), col.rate, rateW, textY + 11.5)
      listCell(money(item.lineTotal), col.amount, amountW, textY + 11.5, inset)
    }
    y += rowH + (extras.length ? 6 : 0)

    // Vehicle add-ons: indented under the vehicle, priced over the same period
    extras.forEach((extra, k) => {
      const net = line?.extras[k]
      // Insurance carries its excess on a second line so the renter sees what
      // they are liable for per incident, in the offer currency (ISK alongside
      // when the offer is in EUR).
      const excess = extra.kind === 'insurance' ? INSURANCE_EXCESS[extra.tier ?? 'bronze'] : null
      const excessLine = excess
        ? s.excess(offer.currency === 'EUR'
          ? `${formatMoney(excess.eur, 'EUR', locale)} (${formatMoney(excess.isk, 'ISK', locale)})`
          : formatMoney(excess.isk, 'ISK', locale))
        : null
      doc.font('Helvetica').fontSize(9)
      const labelH = extraLabelH(extra)
      doc.fillColor(GOLD).text('+', col.name, y)
      doc.fillColor(INK).text(extraLabel(extra), col.name + 10, y, { width: nameW - 10, ellipsis: true, height: 23 })
      if (excessLine) {
        doc.fontSize(8).fillColor(GRAY).text(excessLine, col.name + 10, y + labelH + 1, { width: noteW - 10, ellipsis: true, height: 10 })
      }
      // Unlimited drivers is per vehicle, so its qty is the vehicle count.
      cell(qtyText(extra), col.qty, qtyW, y, { size: 9 })
      cell(extraRateText(item, extra, net?.unitPrice), col.rate, rateW, y, { size: 9 })
      if (hasPeriod && extra.kind !== 'km') cell(periodOf(item), col.period, periodW, y, { size: 9, color: GRAY })
      cell(money(net?.total ?? extra.total), col.amount, amountW, y, { size: 9, inset })
      if (net) {
        listCell(extraRateText(item, extra), col.rate, rateW, y + 10.5)
        listCell(money(extra.total), col.amount, amountW, y + 10.5, inset)
      }
      y += 5 + Math.max(labelH + (excessLine ? 10 : 0), extraFiguresH)
    })
    if (extras.length) {
      // What this vehicle comes to with its add-ons
      hairline(y + 1, LINE, 0.5, col.name, right)
      cell(s.withExtras, col.name + 40, col.amount - col.name - colGap - 40, y + 7, { size: 8.5, color: GRAY })
      cell(money(line?.groupTotal ?? groupTotal(item)), col.amount, amountW, y + 6.5, { bold: true, inset })
      if (line) listCell(money(groupTotal(item)), col.amount, amountW, y + 18, inset)
      y += groupRowH
    }
    y += 8
    // The table closes with a firmer rule than the one between rows.
    if (isLastItem) hairline(y, INK, 0.75)
    else hairline(y)
    y += 8
  })

  // ── Closing block: notes on the left, the sums on the right ────────────────
  // Safety net only: the last row already reserved this space.
  if (y + tailH - 14 > bottom) {
    doc.addPage()
    runningHead()
  }
  y += 14 - 8
  const closingTop = y

  let ny = closingTop
  if (offer.note) {
    label(s.notes, left, ny)
    ny += 13
    doc.font('Helvetica').fontSize(9).fillColor(INK).text(offer.note, left, ny, { width: notesW, lineGap: 1.5, height: NOTE_MAX_H, ellipsis: true })
    ny += notesH - 13
  }

  let ty = closingTop
  const ledgerRow = (k: string, v: string, color: string = INK) => {
    doc.font('Helvetica').fontSize(9.5).fillColor(color === INK ? GRAY : color).text(k, totalsX + 14, ty, { width: totalsW - amountW - 28 })
    doc.fillColor(color).text(v, totalsX, ty, { width: totalsW - inset, align: 'right' })
    ty += 17
  }
  if (hasDiscount) {
    ledgerRow(s.listSubtotal, money(offer.subtotal))
    const discountLabel = offer.discountType === 'percent' ? `${s.discount} (${num(offer.discountValue ?? 0)}%)` : s.discount
    // ASCII hyphen: the U+2212 minus sign is outside WinAnsi and won't render.
    ledgerRow(discountLabel, `-${money(offer.discountAmount)}`, GOLD)
  }
  if (vat > 0) {
    // VAT is charged on the net amount, so that amount is shown right above it.
    ledgerRow(hasDiscount ? s.netExclVat : s.subtotal, money(net))
    ledgerRow(`${s.vat} (${num(offer.vatRate)}%)`, money(vat))
  }
  if (ledgerRows) ty += 4
  // The grand total is the one filled bar on the page.
  doc.rect(totalsX, ty, totalsW, 30).fill(INK)
  doc.rect(totalsX, ty, 3, 30).fill(GOLD)
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#FFFFFF')
    .text((vat > 0 ? s.totalInclVat : s.totalExclVat).toUpperCase(), totalsX + 14, ty + 10.5, { characterSpacing: 0.6, lineBreak: false })
  doc.fontSize(13).text(money(offer.total), totalsX, ty + 8.5, { width: totalsW - inset, align: 'right', lineBreak: false })
  ty += 30 + 6
  // What the total does and does not include, right under it
  doc.font('Helvetica').fontSize(8).fillColor(GRAY).text(vatNote, totalsX, ty, { width: totalsW - inset, align: 'right', lineBreak: false })
  ty += 10

  y = Math.max(ny, ty) + 18

  // What next: how to say yes and by when, with the contact details
  doc.rect(left, y, width, stripH).fill(PANEL)
  doc.rect(left, y, 3, stripH).fill(GOLD)
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(INK).text(s.acceptTitle, left + 16, y + 11)
  doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(s.accept, left + 16, y + 24, { width: width - 32 })
  let ay = y + 24 + acceptTextH
  if (offer.validUntil) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text(`${s.validUntil} ${offer.validUntil}`, left + 16, ay + 4, { width: width - 32, height: 11, ellipsis: true })
    ay += 4 + 11
  }
  doc.font('Helvetica').fontSize(9).fillColor(INK)
    .text(`${contact.email}   ·   ${contact.phone}`, left + 16, ay + 6, { width: width - 32, lineBreak: false })

  // ── Footer on every page: who the seller is, which offer, which page ───────
  const legal = [
    contact.legalName || 'CF Rentals   ·   Creative Filmmaking',
    contact.kennitala ? `${s.kennitala} ${contact.kennitala}` : '',
    contact.vatNumber ? `${s.vatNo} ${contact.vatNumber}` : '',
  ].filter(Boolean).join('   ·   ')
  const reach = [contact.address, contact.phone, contact.email, website].filter(Boolean).join('   ·   ')
  const range = doc.bufferedPageRange()
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i)
    const fy = doc.page.height - 54
    hairline(fy)
    const pageLine = `${s.title} ${offerNumber}   ·   ${s.page(i + 1, range.count)}`
    doc.font('Helvetica').fontSize(7.5)
    const pageLineW = doc.widthOfString(pageLine)
    doc.fillColor(MUTED).text(pageLine, left, fy + 9, { width, align: 'right', lineBreak: false })
    doc.text(reach, left, fy + 20, { width, height: 9, ellipsis: true })
    doc.font('Helvetica-Bold').fillColor(GRAY).text(legal, left, fy + 9, { width: width - pageLineW - 12, height: 9, ellipsis: true })
  }

  doc.end()
  return done
}
