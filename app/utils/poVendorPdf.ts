// Client-side PDF for a single purchase order: the formal numbered document a
// department hands the vendor. Same branded chrome as the other portal PDFs.
// The order's status is always printed so an unapproved request can never
// masquerade as an approved purchase order.

import type { PDFFont, PDFPage } from 'pdf-lib'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PurchaseOrder } from '~/types'
import { vatPortion } from '~/utils/poReport'

export interface VendorPoPdfMeta {
  companyName: string
  jobName: string
  /** Pre-formatted, localized creation date. */
  dateText: string
  /** Pre-formatted approval date (empty when not approved). */
  decidedDateText: string
}

export interface VendorPoPdfLabels {
  title: string
  date: string
  job: string
  vendor: string
  description: string
  dept: string
  code: string
  createdBy: string
  net: string
  vat: string
  total: string
  approvedBy: string
  statusPending: string
  statusRejected: string
}

const PAGE_W = 595.28
const PAGE_H = 841.89
const M = 50

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

const BAND = hex('#161616')
const TITLE_GOLD = hex('#F2E18C')
const CREAM = hex('#F5F2E9')
const GOLD = hex('#A87A1F')
const INK = hex('#1A1A1F')
const SOFT = hex('#44444C')
const GRAY = hex('#6B6B74')
const LINE = hex('#DDDAD2')
const WARN = hex('#C9A227')
const OVER = hex('#C0392B')
const OK = hex('#3E8E5F')

const CP1252_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')
const safe = (s: string): string =>
  [...s.normalize('NFC')].filter(c => c.charCodeAt(0) < 0x100 || CP1252_EXTRA.has(c)).join('')

const isk = (n: number): string => `${Math.round(n).toLocaleString('is-IS')} kr.`

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = []
  for (const raw of text.split('\n')) {
    const words = raw.split(/\s+/).filter(Boolean)
    let line = ''
    for (let w of words) {
      while (font.widthOfTextAtSize(w, size) > maxW && w.length > 1) {
        let cut = w.length - 1
        while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > maxW) cut--
        if (line) { out.push(line); line = '' }
        out.push(w.slice(0, cut))
        w = w.slice(cut)
      }
      const cand = line ? `${line} ${w}` : w
      if (font.widthOfTextAtSize(cand, size) <= maxW) line = cand
      else { if (line) out.push(line); line = w }
    }
    if (line) out.push(line)
  }
  return out
}

export async function exportVendorPoPdf(order: PurchaseOrder, meta: VendorPoPdfMeta, labels: VendorPoPdfLabels): Promise<Uint8Array> {
  const poNo = `PO-${String(order.poNumber).padStart(3, '0')}`
  const pdf = await PDFDocument.create()
  pdf.setTitle(`${poNo} - ${meta.jobName}`)
  const reg = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const page: PDFPage = pdf.addPage([PAGE_W, PAGE_H])
  const text = (s: string, x: number, baselineTop: number, font: PDFFont, size: number, color = INK) =>
    page.drawText(safe(s), { x, y: PAGE_H - baselineTop, size, font, color })
  const textRight = (s: string, rightX: number, baselineTop: number, font: PDFFont, size: number, color = INK) =>
    text(s, rightX - font.widthOfTextAtSize(safe(s), size), baselineTop, font, size, color)

  // ── Header band: company + document type left, big PO number right ─────────
  page.drawRectangle({ x: 0, y: PAGE_H - 118, width: PAGE_W, height: 118, color: BAND })
  const company = safe(meta.companyName.trim()).toUpperCase()
  let companySize = 22
  const poW = bold.widthOfTextAtSize(poNo, 26) + 30
  while (companySize > 11 && bold.widthOfTextAtSize(company, companySize) > PAGE_W - 2 * M - poW) companySize -= 1
  text(company, M, 56, bold, companySize, TITLE_GOLD)
  text(labels.title.toUpperCase(), M, 82, bold, 11, CREAM)
  textRight(poNo, PAGE_W - M, 74, bold, 26, CREAM)

  let yTop = 118 + 34

  /** One labeled field row: small gray caption, then the value lines. */
  const field = (caption: string, value: string, valueFont = reg, valueSize = 11, color = INK) => {
    if (!value) return
    text(caption.toUpperCase(), M, yTop, reg, 7.5, GRAY)
    yTop += 13
    for (const line of wrap(value, valueFont, valueSize, PAGE_W - 2 * M)) {
      text(line, M, yTop, valueFont, valueSize, color)
      yTop += valueSize + 3.5
    }
    yTop += 9
  }

  field(labels.date, meta.dateText)
  field(labels.job, meta.jobName)
  field(labels.vendor, order.vendor, bold, 14)
  field(labels.description, order.description ?? '')
  const bookkeeping = [
    order.costCode ? `${order.costCode}${order.costCodeName ? ` ${order.costCodeName}` : ''}` : '',
    order.departmentName ?? '',
  ].filter(Boolean).join('  ·  ')
  if (order.costCode) field(labels.code, bookkeeping)
  else if (order.departmentName) field(labels.dept, order.departmentName)
  field(labels.createdBy, order.createdByName)

  // ── Amount block ───────────────────────────────────────────────────────────
  yTop += 6
  page.drawLine({ start: { x: M, y: PAGE_H - yTop }, end: { x: PAGE_W - M, y: PAGE_H - yTop }, thickness: 0.5, color: LINE })
  yTop += 18
  const RIGHT = PAGE_W - M
  if (order.vatRate !== undefined && order.vatRate > 0) {
    const vat = vatPortion(order.amount, order.vatRate)
    text(labels.net, M, yTop, reg, 10, SOFT)
    textRight(isk(order.amount - vat), RIGHT, yTop, reg, 10, SOFT)
    yTop += 16
    text(`${labels.vat} (${order.vatRate}%)`, M, yTop, reg, 10, SOFT)
    textRight(isk(vat), RIGHT, yTop, reg, 10, SOFT)
    yTop += 18
  }
  page.drawRectangle({ x: M, y: PAGE_H - (yTop + 18), width: PAGE_W - 2 * M, height: 26, color: BAND })
  text(labels.total.toUpperCase(), M + 10, yTop + 10, bold, 10, TITLE_GOLD)
  textRight(isk(order.amount), RIGHT - 10, yTop + 11, bold, 13, CREAM)
  yTop += 40

  // ── Status / approval line ─────────────────────────────────────────────────
  if (order.status === 'approved' && order.decidedByName) {
    text(`${labels.approvedBy}: ${order.decidedByName}${meta.decidedDateText ? `, ${meta.decidedDateText}` : ''}`, M, yTop, bold, 10, OK)
  }
  else if (order.status === 'rejected') {
    text(labels.statusRejected.toUpperCase(), M, yTop, bold, 10, OVER)
  }
  else {
    text(labels.statusPending.toUpperCase(), M, yTop, bold, 10, WARN)
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const foot = safe([meta.companyName, meta.jobName, poNo].filter(Boolean).join(' · '))
  page.drawText(foot, { x: M, y: 32, size: 7.5, font: reg, color: GRAY })

  return pdf.save()
}
