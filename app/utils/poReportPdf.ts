// Client-side PDF export for the purchase-order cost report (kostnaðarskýrsla):
// the weekly line-producer deliverable. Same branded chrome as the call-sheet
// PDF: dark title band with gold headline, summary table per cost code with
// budget-usage bars, department subtotals, grand total band, then the order
// list. Built-in Helvetica covers Icelandic (WinAnsi).

import type { PDFFont, PDFPage } from 'pdf-lib'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PoReport } from '~/utils/poReport'

export interface PoReportPdfMeta {
  jobName: string
  companyName: string
  /** Pre-formatted, localized date string. */
  dateText: string
  /** "Deild: X" on department-scoped reports, empty for whole-job reports. */
  scopeText: string
}

export interface PoReportPdfLabels {
  title: string
  summary: string
  colCode: string
  colCount: string
  colCommitted: string
  colPaid: string
  colBudget: string
  byDept: string
  grandTotal: string
  vatLine: string
  rebateLine: string
  noCode: string
  noDept: string
  noBudget: string
  ordersTitle: string
  colNo: string
  colDate: string
  colVendor: string
  colAmount: string
  colStatus: string
  statusText: Record<'pending' | 'approved' | 'rejected', string>
  paidText: string
  continued: string
}

// A4 portrait in PDF points.
const PAGE_W = 595.28
const PAGE_H = 841.89
const M = 50
const BOTTOM = 64

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
const BAR_BG = hex('#E8E5DD')
const BAR_OK = hex('#3E8E5F')
const BAR_WARN = hex('#C9A227')
const BAR_OVER = hex('#C0392B')

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

export async function exportPoReportPdf(report: PoReport, meta: PoReportPdfMeta, labels: PoReportPdfLabels): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const title = safe(meta.jobName.trim()).toUpperCase() || 'COST REPORT'
  pdf.setTitle(`${labels.title} - ${meta.jobName}`)
  const reg = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  let page: PDFPage = pdf.addPage([PAGE_W, PAGE_H])
  const text = (p: PDFPage, s: string, x: number, baselineTop: number, font: PDFFont, size: number, color = INK) =>
    p.drawText(safe(s), { x, y: PAGE_H - baselineTop, size, font, color })
  const textRight = (p: PDFPage, s: string, rightX: number, baselineTop: number, font: PDFFont, size: number, color = INK) =>
    text(p, s, rightX - font.widthOfTextAtSize(safe(s), size), baselineTop, font, size, color)

  // ── Header band ────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: PAGE_H - 104, width: PAGE_W, height: 104, color: BAND })
  let titleSize = 24
  while (titleSize > 12 && bold.widthOfTextAtSize(title, titleSize) > PAGE_W - 2 * M) titleSize -= 1
  text(page, title, M, 58, bold, titleSize, TITLE_GOLD)
  const sub = [labels.title.toUpperCase(), safe(meta.companyName), safe(meta.scopeText), safe(meta.dateText)]
    .filter(Boolean).join('  ·  ')
  text(page, sub, M, 80, bold, 10.5, CREAM)

  let yTop = 104 + 26

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H])
    text(page, `${title} · ${labels.title} (${labels.continued})`, M, 42, bold, 10, INK)
    page.drawLine({ start: { x: M, y: PAGE_H - 50 }, end: { x: PAGE_W - M, y: PAGE_H - 50 }, thickness: 1, color: GOLD })
    yTop = 72
  }
  const ensureSpace = (h: number) => {
    if (yTop + h > PAGE_H - BOTTOM) newPage()
  }
  const sectionHead = (label: string) => {
    ensureSpace(64)
    yTop += 12
    text(page, label.toUpperCase(), M, yTop, bold, 8.5, GOLD)
    yTop += 6
    page.drawLine({ start: { x: M, y: PAGE_H - yTop }, end: { x: PAGE_W - M, y: PAGE_H - yTop }, thickness: 0.5, color: LINE })
    yTop += 16
  }

  // ── Summary per cost code ──────────────────────────────────────────────────
  sectionHead(labels.summary)
  // code+name | count | committed | paid | budget+bar
  const CODE_X = M
  const CODE_W = 150
  const COUNT_R = M + 180
  const COMMIT_R = M + 268
  const PAID_R = M + 340
  const BUDGET_X = M + 352
  const BUDGET_W = PAGE_W - M - BUDGET_X

  const summaryHeader = () => {
    text(page, labels.colCode.toUpperCase(), CODE_X, yTop, reg, 7.5, GRAY)
    textRight(page, labels.colCount.toUpperCase(), COUNT_R, yTop, reg, 7.5, GRAY)
    textRight(page, labels.colCommitted.toUpperCase(), COMMIT_R, yTop, reg, 7.5, GRAY)
    textRight(page, labels.colPaid.toUpperCase(), PAID_R, yTop, reg, 7.5, GRAY)
    text(page, labels.colBudget.toUpperCase(), BUDGET_X, yTop, reg, 7.5, GRAY)
    yTop += 14
  }
  summaryHeader()

  for (const r of report.codeRows) {
    const nameText = r.code ? `${r.code}  ${r.name}` : labels.noCode
    const nameLines = wrap(nameText, bold, 9.5, CODE_W)
    const rowH = Math.max(nameLines.length * 12, r.budget ? 24 : 12) + 6
    if (yTop + rowH > PAGE_H - BOTTOM) {
      newPage()
      summaryHeader()
    }
    nameLines.forEach((l, i) => text(page, l, CODE_X, yTop + i * 12, bold, 9.5, INK))
    if (r.departmentName) {
      text(page, r.departmentName, CODE_X, yTop + nameLines.length * 12, reg, 7.5, GRAY)
    }
    textRight(page, String(r.count), COUNT_R, yTop, reg, 9, SOFT)
    textRight(page, isk(r.committed), COMMIT_R, yTop, reg, 9, INK)
    textRight(page, isk(r.paid), PAID_R, yTop, reg, 9, SOFT)
    if (r.budget) {
      textRight(page, `${isk(r.committed)} / ${isk(r.budget)}`, PAGE_W - M, yTop, reg, 8, r.pct > 100 ? BAR_OVER : SOFT)
      const barY = PAGE_H - (yTop + 10)
      const barW = BUDGET_W
      page.drawRectangle({ x: BUDGET_X, y: barY - 5, width: barW, height: 5, color: BAR_BG })
      const fillW = Math.max(1, Math.min(1, r.committed / r.budget) * barW)
      const fillColor = r.pct > 100 ? BAR_OVER : r.pct > 85 ? BAR_WARN : BAR_OK
      page.drawRectangle({ x: BUDGET_X, y: barY - 5, width: fillW, height: 5, color: fillColor })
      textRight(page, `${r.pct}%`, PAGE_W - M, yTop + 22, bold, 8, fillColor)
    }
    else {
      text(page, labels.noBudget, BUDGET_X, yTop, reg, 8, GRAY)
    }
    const deptExtra = r.departmentName ? 10 : 0
    yTop += Math.max(rowH, deptExtra + 18)
    page.drawLine({ start: { x: M, y: PAGE_H - (yTop - 4) }, end: { x: PAGE_W - M, y: PAGE_H - (yTop - 4) }, thickness: 0.4, color: LINE })
    yTop += 4
  }

  // Grand total band plus the VAT/rebate lines under it — reserve for all three.
  ensureSpace(64)
  page.drawRectangle({ x: M, y: PAGE_H - (yTop + 16), width: PAGE_W - 2 * M, height: 20, color: BAND })
  text(page, labels.grandTotal.toUpperCase(), M + 8, yTop + 10, bold, 8.5, TITLE_GOLD)
  textRight(page, isk(report.grand.committed), COMMIT_R, yTop + 10, bold, 9, CREAM)
  textRight(page, isk(report.grand.paid), PAID_R, yTop + 10, bold, 9, CREAM)
  if (report.grand.budget) {
    textRight(page, `${isk(report.grand.committed)} / ${isk(report.grand.budget)}`, PAGE_W - M - 8, yTop + 10, bold, 8.5, CREAM)
  }
  yTop += 30
  // VAT + rebate lines under the band.
  text(page, `${labels.vatLine}: ${isk(report.grand.vat)}`, M, yTop, reg, 9, SOFT)
  yTop += 13
  text(page, `${labels.rebateLine}: ${isk(report.grand.rebate)}`, M, yTop, reg, 9, SOFT)
  yTop += 8

  // ── Department subtotals ───────────────────────────────────────────────────
  if (report.deptSubtotals.length > 1) {
    sectionHead(labels.byDept)
    for (const d of report.deptSubtotals) {
      ensureSpace(15)
      text(page, d.name || labels.noDept, M, yTop, bold, 9.5, INK)
      textRight(page, String(d.count), COUNT_R, yTop, reg, 9, SOFT)
      textRight(page, isk(d.committed), COMMIT_R, yTop, reg, 9, INK)
      textRight(page, isk(d.paid), PAID_R, yTop, reg, 9, SOFT)
      yTop += 15
    }
  }

  // ── Order list ─────────────────────────────────────────────────────────────
  if (report.orders.length) {
    sectionHead(labels.ordersTitle)
    const NO_X = M
    const DATE_X = M + 46
    const VENDOR_X = M + 104
    const VENDOR_W = 210
    const AMOUNT_R = M + 400
    const STATUS_X = M + 412
    const ordersHeader = () => {
      text(page, labels.colNo.toUpperCase(), NO_X, yTop, reg, 7.5, GRAY)
      text(page, labels.colDate.toUpperCase(), DATE_X, yTop, reg, 7.5, GRAY)
      text(page, labels.colVendor.toUpperCase(), VENDOR_X, yTop, reg, 7.5, GRAY)
      textRight(page, labels.colAmount.toUpperCase(), AMOUNT_R, yTop, reg, 7.5, GRAY)
      text(page, labels.colStatus.toUpperCase(), STATUS_X, yTop, reg, 7.5, GRAY)
      yTop += 14
    }
    ordersHeader()
    for (const o of report.orders) {
      const vendorLines = wrap(o.vendor, bold, 9, VENDOR_W)
      const descLines = o.description ? wrap(o.description, reg, 8, VENDOR_W) : []
      const codeLine = [o.code, o.departmentName].filter(Boolean).join(' · ')
      const rowH = vendorLines.length * 11.5 + descLines.length * 10.5 + (codeLine ? 10.5 : 0) + 6
      if (yTop + rowH > PAGE_H - BOTTOM) {
        newPage()
        ordersHeader()
      }
      text(page, `PO-${String(o.poNumber).padStart(3, '0')}`, NO_X, yTop, bold, 8.5, INK)
      text(page, o.dateIso, DATE_X, yTop, reg, 8.5, GRAY)
      vendorLines.forEach((l, i) => text(page, l, VENDOR_X, yTop + i * 11.5, bold, 9, INK))
      let cy = yTop + vendorLines.length * 11.5
      descLines.forEach((l) => {
        text(page, l, VENDOR_X, cy, reg, 8, SOFT)
        cy += 10.5
      })
      if (codeLine) {
        text(page, codeLine, VENDOR_X, cy, reg, 8, GRAY)
      }
      const effective = o.paid && o.actualAmount !== null ? o.actualAmount : o.amount
      textRight(page, isk(effective), AMOUNT_R, yTop, bold, 9, o.status === 'rejected' ? GRAY : INK)
      const statusStr = o.paid ? `${labels.statusText[o.status]} · ${labels.paidText}` : labels.statusText[o.status]
      const statusColor = o.status === 'rejected' ? BAR_OVER : o.status === 'approved' ? BAR_OK : BAR_WARN
      text(page, statusStr, STATUS_X, yTop, reg, 8, statusColor)
      yTop += rowH
      page.drawLine({ start: { x: M, y: PAGE_H - (yTop - 3) }, end: { x: PAGE_W - M, y: PAGE_H - (yTop - 3) }, thickness: 0.4, color: LINE })
      yTop += 4
    }
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const pages = pdf.getPages()
  const foot = safe([meta.jobName, labels.title, meta.scopeText, meta.dateText].filter(Boolean).join(' · '))
  pages.forEach((p, i) => {
    p.drawText(foot, { x: M, y: 32, size: 7.5, font: reg, color: GRAY })
    const num = `${i + 1} / ${pages.length}`
    p.drawText(num, { x: PAGE_W - M - reg.widthOfTextAtSize(num, 7.5), y: 32, size: 7.5, font: reg, color: GRAY })
  })

  return pdf.save()
}
