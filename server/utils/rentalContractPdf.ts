import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { ContractAnnexKind, ContractVehicle, RentalContract, RentalContractData } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Rental agreement PDF. The designed forms (server/assets/contracts/*.pdf,
// "CF Rentals · Vehicle Rental Agreement", single and multi-vehicle) are the
// templates; this module copies their pages and writes the contract data
// into the blank boxes. Coordinates are PDF points with a top-left origin,
// measured off the templates' text layer (pdfjs), and converted to pdf-lib's
// bottom-left origin in one place (the `at` helper). Helvetica is WinAnsi:
// Icelandic fits, anything else prints as '?'.
//
// Page plan:  1  agreement (single or multi layout)
//             2  terms and conditions (unchanged)
//             A  one condition record per vehicle, diagram by vehicle type
//             B  driver list when there are more than three drivers
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_H = 841.92
const INK = rgb(0.1, 0.1, 0.12)
const WHITE = rgb(1, 1, 1)

type TemplateName = 'single' | 'multi'

/** Template pages, 0-based. Annex A pages (pickup/van/box) are the same in both files. */
const PAGES = { agreement: 0, terms: 1, annexPickup: 2, annexVan: 3, annexBox: 4, annexB: 5 } as const

const templateCache = new Map<TemplateName, Promise<Uint8Array>>()

/** Template bytes: Nitro server assets in production, the source dir in dev. */
function loadTemplate(name: TemplateName): Promise<Uint8Array> {
  let cached = templateCache.get(name)
  if (!cached) {
    cached = (async () => {
      const raw = await useStorage('assets:server').getItemRaw<Uint8Array | Buffer>(`contracts/${name}.pdf`).catch(() => null)
      if (raw && raw.length) return new Uint8Array(raw)
      return new Uint8Array(await fs.readFile(join(process.cwd(), 'server', 'assets', 'contracts', `${name}.pdf`)))
    })()
    templateCache.set(name, cached)
    cached.catch(() => templateCache.delete(name))
  }
  return cached
}

const winAnsiSafe = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')

interface Writer {
  page: PDFPage
  font: PDFFont
  bold: PDFFont
}

interface TextOpts {
  size?: number
  bold?: boolean
  /** Shrink the font (down to `minSize`) and then ellipsise to fit this width. */
  width?: number
  minSize?: number
  align?: 'left' | 'right' | 'center'
}

/** Write a string with its baseline at (x, yTop) in top-left coordinates. */
function at(w: Writer, text: string | number | null | undefined, x: number, yTop: number, opts: TextOpts = {}) {
  if (text === null || text === undefined || text === '') return
  let str = winAnsiSafe(String(text))
  const font = opts.bold ? w.bold : w.font
  let size = opts.size ?? 8
  const minSize = opts.minSize ?? Math.max(5.5, size - 2.5)
  if (opts.width) {
    while (size > minSize && font.widthOfTextAtSize(str, size) > opts.width) size -= 0.25
    if (font.widthOfTextAtSize(str, size) > opts.width) {
      while (str.length > 1 && font.widthOfTextAtSize(`${str}…`, size) > opts.width) str = str.slice(0, -1)
      str = `${str.trimEnd()}…`
    }
  }
  const textW = font.widthOfTextAtSize(str, size)
  const drawX = opts.align === 'right' && opts.width ? x + opts.width - textW
    : opts.align === 'center' && opts.width ? x + (opts.width - textW) / 2 : x
  w.page.drawText(str, { x: drawX, y: PAGE_H - yTop, size, font, color: INK })
}

/** Cross out a template checkbox. Boxes sit about 9pt left of their label's x. */
function tick(w: Writer, labelX: number, yTop: number) {
  const left = labelX - 9.1
  const right = labelX - 3.1
  const top = PAGE_H - (yTop - 6.2)
  const bottom = PAGE_H - (yTop + 0.4)
  const line = { thickness: 1, color: INK }
  w.page.drawLine({ start: { x: left, y: bottom }, end: { x: right, y: top }, ...line })
  w.page.drawLine({ start: { x: left, y: top }, end: { x: right, y: bottom }, ...line })
}

/** Paint over printed template text so it can be rewritten. */
function whiteout(w: Writer, x: number, yTop: number, width: number, height: number, color = WHITE) {
  w.page.drawRectangle({ x, y: PAGE_H - yTop - height, width, height, color })
}

/** Background of the highlighted "Total" row in section 6. */
const CREAM = rgb(253 / 255, 248 / 255, 238 / 255)

const fmtMoney = (n: number | null, currency: string) =>
  n === null ? '' : currency === 'ISK'
    ? Math.round(n).toLocaleString('en-US')
    : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtNum = (n: number | null) => n === null ? '' : n.toLocaleString('en-US', { maximumFractionDigits: 2 })

const fmtDate = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso
}

const FUEL_LABEL: Record<string, string> = { petrol: 'Petrol', diesel: 'Diesel', electric: 'Electric' }

export function resolveTemplate(data: RentalContractData): TemplateName {
  if (data.template === 'single' || data.template === 'multi') return data.template
  return data.vehicles.length > 1 ? 'multi' : 'single'
}

export async function generateRentalContractPdf(contract: RentalContract): Promise<Buffer> {
  const data = contract.data
  const layout = resolveTemplate(data)
  const [singleBytes, multiBytes] = await Promise.all([loadTemplate('single'), loadTemplate('multi')])
  const [single, multi] = await Promise.all([PDFDocument.load(singleBytes), PDFDocument.load(multiBytes)])
  const src = layout === 'multi' ? multi : single

  const out = await PDFDocument.create()
  out.setTitle(`Vehicle rental agreement ${contract.number}`)
  out.setAuthor('Creative Filmmaking ehf.')
  const font = await out.embedFont(StandardFonts.Helvetica)
  const bold = await out.embedFont(StandardFonts.HelveticaBold)
  const writer = (page: PDFPage): Writer => ({ page, font, bold })

  const drivers = data.drivers
  const needsAnnexB = data.annexB || drivers.length > 3
  const vehicles = layout === 'single' ? data.vehicles.slice(0, 1) : data.vehicles
  const annexVehicles = data.annexA ? vehicles.filter(v => v.annexKind !== 'none') : []

  // ── Page 1: agreement ──────────────────────────────────────────────────────
  const vehicleChunks: ContractVehicle[][] = layout === 'multi'
    ? Array.from({ length: Math.max(1, Math.ceil(vehicles.length / 5)) }, (_, i) => vehicles.slice(i * 5, i * 5 + 5))
    : [vehicles]
  for (const [chunkIdx, chunk] of vehicleChunks.entries()) {
    const [page] = await out.copyPages(src, [PAGES.agreement])
    out.addPage(page!)
    const w = writer(page!)
    const continuation = chunkIdx > 0
    if (layout === 'single') fillSinglePage(w, data, contract.number, needsAnnexB)
    else fillMultiPage(w, data, contract.number, chunk, continuation, needsAnnexB, annexVehicles.length)
  }

  // ── Page 2: terms (as designed) ────────────────────────────────────────────
  {
    const [page] = await out.copyPages(src, [PAGES.terms])
    out.addPage(page!)
  }

  // ── Annex A: one condition record per vehicle ──────────────────────────────
  for (const v of annexVehicles) {
    const pageIndex: number = v.annexKind === 'van' ? PAGES.annexVan : v.annexKind === 'box' ? PAGES.annexBox : PAGES.annexPickup
    const [page] = await out.copyPages(single, [pageIndex])
    out.addPage(page!)
    fillAnnexA(writer(page!), v, contract.number)
  }

  // ── Annex B: further drivers ───────────────────────────────────────────────
  if (needsAnnexB) {
    const [page] = await out.copyPages(src, [PAGES.annexB])
    out.addPage(page!)
    fillAnnexB(writer(page!), data, contract.number, layout, vehicles)
  }

  return Buffer.from(await out.save())
}

// ── Shared blocks (same coordinates on both page-1 layouts) ──────────────────

function fillRenterAndDrivers(w: Writer, data: RentalContractData, furtherDriversLabelX: number, needsAnnexB: boolean) {
  const r = data.renter
  at(w, r.name, 34, 180.5, { size: 8.5, bold: true, width: 180 })
  at(w, r.idNo, 219.9, 180.5, { width: 122 })
  at(w, r.phone, 348.4, 180.5, { width: 86 })
  at(w, r.passportNo, 441.4, 180.5, { width: 120 })
  at(w, r.address, 34, 204.5, { width: 180 })
  at(w, r.email, 219.9, 204.5, { width: 122 })
  at(w, r.licenceNo, 348.4, 204.5, { width: 86 })
  at(w, r.licenceCountryExpiry, 441.4, 204.5, { width: 120 })

  const rows = [252.7, 269.2, 286.5]
  data.drivers.slice(0, 3).forEach((d, i) => {
    const y = rows[i]!
    at(w, d.name, 56.3, y, { width: 150 })
    at(w, d.idNo, 212.8, y, { width: 85 })
    at(w, d.licenceNo, 303.5, y, { width: 85 })
    at(w, d.issuingCountry, 394.2, y, { width: 64 })
  })
  if (needsAnnexB) tick(w, furtherDriversLabelX, 220.5)
}

function fillPayment(w: Writer, data: RentalContractData, methodY: number, timingY: number) {
  const method = { card: 119.2, bank: 152.2, invoice: 216.9 }[data.paymentMethod as 'card' | 'bank' | 'invoice']
  if (method) tick(w, method, methodY)
  at(w, data.paymentRef, 346, methodY, { width: 210 })
  const timing = { pickup: 89.2, invoice: 158.5, return: 202.4 }[data.paymentTiming as 'pickup' | 'invoice' | 'return']
  if (timing) tick(w, timing, timingY)
}

/** Rewrites the section-6 header and the currency tags when the contract isn't plain "ISK incl. 24% VAT". */
function fixCurrencyLabels(
  w: Writer, data: RentalContractData, headerY: number, tagX: number, rowYs: number[], totalY: number,
  /** Further "ISK" words inside row text (single layout: "× ISK ___ per day"). */
  inlineTags: { x: number, y: number }[] = [],
) {
  const standard = data.currency === 'ISK' && data.vatRate === 24
  if (standard) return
  const vatText = data.vatRate > 0 ? `including ${fmtNum(data.vatRate)}% VAT` : 'without VAT'
  whiteout(w, 165, headerY - 7.5, 110, 10)
  at(w, `· ${data.currency}, ${vatText}`, 166, headerY, { size: 7.4 })
  for (const y of rowYs) {
    whiteout(w, tagX - 1, y - 7.5, 17, 10, y === totalY ? CREAM : WHITE)
    at(w, data.currency, tagX, y, { size: 7.7, bold: y === totalY })
  }
  if (data.currency !== 'ISK') {
    for (const { x, y } of inlineTags) {
      whiteout(w, x - 0.5, y - 7.5, 14, 10)
      at(w, data.currency, x, y, { size: 7.7 })
    }
  }
  whiteout(w, 38, totalY - 7.5, 80, 10, CREAM)
  at(w, data.vatRate > 0 ? `Total incl. ${fmtNum(data.vatRate)}% VAT` : 'Total excl. VAT', 39.3, totalY, { size: 7.7, bold: true })
}

// ── Single-vehicle layout ────────────────────────────────────────────────────

function fillSinglePage(w: Writer, data: RentalContractData, number: string, needsAnnexB: boolean) {
  at(w, number, 379.8, 79, { size: 9, bold: true })
  at(w, fmtDate(data.agreementDate), 477.5, 79, { size: 9, bold: true })
  fillRenterAndDrivers(w, data, 321.3, needsAnnexB)

  const v = data.vehicles[0]
  if (v) {
    at(w, v.makeModel, 34, 341, { size: 8.5, bold: true, width: 185 })
    at(w, v.regNo, 226.1, 341, { size: 9, bold: true, width: 90 })
    if (v.fuel === 'petrol') tick(w, 333.4, 334.1)
    if (v.fuel === 'diesel') tick(w, 371.0, 334.1)
    if (v.fuel === 'electric') tick(w, 333.4, 349.8)
    tick(w, v.fRoads ? 429.5 : 461.8, 334.1)
    at(w, v.pickupAt, 107.3, 411.7, { width: 86 })
    at(w, v.kmOut, 197.3, 411.7, { width: 70 })
    at(w, v.returnAt, 107.3, 429, { width: 86 })
  }
  at(w, data.pickupLocation, 34, 376.5, { width: 185 })
  at(w, data.returnLocation, 226.1, 376.5, { width: 185 })
  if (data.kmUnlimited) tick(w, 429.5, 374.6)
  else {
    tick(w, 480.7, 375.2)
    at(w, fmtNum(data.kmPerDay), 482, 375.2, { size: 7.5, width: 20, align: 'right' })
  }

  const c = data.charges
  const cur = data.currency
  const amountX = 480
  const amountW = 76
  const rows = [540.2, 556.7, 573.2]
  fixCurrencyLabels(w, data, 522, 463.7, [...rows, 589.5], 589.5,
    [{ x: 145.2, y: 540.2 }, { x: 156.4, y: 556.7 }, { x: 219.5, y: 573.2 }])
  at(w, fmtNum(c.rentalDays), 96, 540.2, { size: 7.7, width: 20, align: 'right' })
  at(w, fmtMoney(c.rentalRate, cur), 159, 540.2, { size: 7.7, width: 40, align: 'right' })
  at(w, fmtMoney(c.rental, cur), amountX, 540.2, { size: 8, width: amountW, align: 'right' })
  at(w, fmtNum(c.insuranceDays), 106, 556.7, { size: 7.7, width: 21, align: 'right' })
  at(w, fmtMoney(c.insuranceRate, cur), 170, 556.7, { size: 7.7, width: 40, align: 'right' })
  at(w, fmtMoney(c.insurance, cur), amountX, 556.7, { size: 8, width: amountW, align: 'right' })
  at(w, fmtNum(c.driversCount), 109, 573.2, { size: 7.7, width: 22, align: 'right' })
  at(w, fmtNum(c.driversDays), 168, 573.2, { size: 7.7, width: 22, align: 'right' })
  at(w, fmtMoney(c.driversRate, cur), 233, 573.2, { size: 7.7, width: 40, align: 'right' })
  at(w, c.extrasText, 343, 573.2, { size: 7.2, width: 112, minSize: 5.5 })
  at(w, fmtMoney(c.extras, cur), amountX, 573.2, { size: 8, width: amountW, align: 'right' })
  at(w, fmtMoney(c.total, cur), amountX, 589.5, { size: 8.5, bold: true, width: amountW, align: 'right' })
  fillPayment(w, data, 606.2, 622.5)

  at(w, data.existingDamage, 34, 672, { size: 7.5, width: 258, minSize: 6 })
  if (data.annexA) tick(w, 313.8, 670.8)
  if (data.photosTaken) tick(w, 429.6, 670.8)
  at(w, data.placeAndDate, 455.9, 770, { width: 100 })
  at(w, data.licenceNo, 224, 822.9, { size: 6.4, width: 80 })
}

// ── Multi-vehicle layout ─────────────────────────────────────────────────────

function fillMultiPage(
  w: Writer, data: RentalContractData, number: string, chunk: ContractVehicle[],
  continuation: boolean, needsAnnexB: boolean, annexSheets: number,
) {
  // The multi form only has a date box; give it an agreement-number box like the single one.
  w.page.drawRectangle({ x: 374, y: PAGE_H - 84, width: 91, height: 24, borderColor: INK, borderWidth: 0.8 })
  at(w, 'AGREEMENT NO.', 379.8, 68.2, { size: 5.9, bold: true })
  at(w, continuation ? `${number} (cont.)` : number, 379.8, 79, { size: 9, bold: true })
  at(w, fmtDate(data.agreementDate), 477.5, 79, { size: 9, bold: true })

  if (!continuation) fillRenterAndDrivers(w, data, 325.4, needsAnnexB)
  else {
    at(w, 'Continued from the first sheet of this agreement: further vehicles in section 4. All other sections apply as on the first sheet.',
      34, 180.5, { size: 7.5, width: 527 })
  }

  at(w, data.pickupLocation, 34, 336.5, { width: 190 })
  at(w, data.returnLocation, 230.8, 336.5, { width: 190 })
  if (data.kmUnlimited) tick(w, 438.9, 334.1)
  else {
    tick(w, 489.2, 334.7)
    at(w, fmtNum(data.kmPerDay), 490, 334.7, { size: 7.5, width: 20, align: 'right' })
  }

  const rows = [369.7, 387.7, 406.5, 424.5, 442.5]
  chunk.forEach((v, i) => {
    const y = rows[i]!
    at(w, v.makeModel, 56.3, y, { size: 7.5, width: 84 })
    at(w, v.regNo, 143.5, y, { size: 8, bold: true, width: 58 })
    at(w, FUEL_LABEL[v.fuel] ?? '', 205.8, y, { size: 7.5, width: 33 })
    at(w, v.pickupAt, 242.7, y, { size: 7.5, width: 76 })
    at(w, v.returnAt, 322.0, y, { size: 7.5, width: 76 })
    at(w, v.kmOut ? `${v.kmOut} /` : '', 401.4, y, { size: 7.5, width: 68 })
    at(w, v.fRoads ? 'Yes' : 'No', 475.1, y, { size: 7.5, width: 36 })
    at(w, fmtMoney(v.ratePerDay, data.currency), 514.8, y, { size: 7.5, width: 44, align: 'right' })
  })

  if (continuation) return

  const c = data.charges
  const cur = data.currency
  const amountX = 470
  const amountW = 86
  fixCurrencyLabels(w, data, 534, 452.4, [552, 568.5, 585.2, 601.5], 601.5)
  at(w, fmtMoney(c.rental, cur), amountX, 552, { size: 8, width: amountW, align: 'right' })
  at(w, fmtMoney(c.insurance, cur), amountX, 568.5, { size: 8, width: amountW, align: 'right' })
  at(w, c.extrasText, 151, 585.2, { size: 7.5, width: 290, minSize: 5.5 })
  at(w, fmtMoney(c.extras, cur), amountX, 585.2, { size: 8, width: amountW, align: 'right' })
  at(w, fmtMoney(c.total, cur), amountX, 601.5, { size: 8.5, bold: true, width: amountW, align: 'right' })
  fillPayment(w, data, 618.2, 634.5)

  if (data.annexA) {
    tick(w, 313.8, 683.4)
    at(w, String(annexSheets), 389, 683.4, { size: 7.5, width: 20, align: 'right' })
  }
  if (data.photosTaken) tick(w, 457.0, 682.8)
  at(w, data.placeAndDate, 455.9, 780, { width: 100 })
  at(w, data.licenceNo, 224, 822.9, { size: 6.4, width: 80 })
}

// ── Annex A: condition record ────────────────────────────────────────────────

const ANNEX_TITLE: Record<ContractAnnexKind, string> = {
  pickup: 'Pickup truck', van: 'Ford Transit van L2H2', box: 'Ford Transit box truck', generic: '', none: '',
}

function fillAnnexA(w: Writer, v: ContractVehicle, number: string) {
  at(w, number, 379.8, 79, { size: 9, bold: true })
  at(w, v.regNo, 477.5, 79, { size: 9, bold: true, width: 80 })

  // Subtitle and footer name the template's vehicle type; swap in the actual vehicle.
  const name = v.makeModel || ANNEX_TITLE[v.annexKind] || 'Vehicle'
  whiteout(w, 230, 40, 332, 11)
  at(w, `${name} · Ástandsskýrsla · attached to the rental agreement`, 230, 48, { size: 7.6, width: 331.3, align: 'right' })
  whiteout(w, 149, 814.5, 210, 9.5)
  at(w, `· Annex A · Vehicle condition record · ${name}`, 150.2, 821.2, { size: 6.4, width: 205 })
  at(w, number, 456, 822.9, { size: 6.4 })

  if (v.annexKind === 'generic') {
    // No outline drawing for this vehicle type: blank the diagram area but
    // keep the legend, and rename the pickup-bed row.
    whiteout(w, 36, 141, 303, 254)
    at(w, 'No outline drawing for this vehicle type.', 36, 255, { size: 8, bold: true, width: 303, align: 'center' })
    at(w, 'Mark existing damage on the photographs taken at pickup', 36, 268, { size: 7.5, width: 303, align: 'center' })
    at(w, 'and list every item in the table below.', 36, 278, { size: 7.5, width: 303, align: 'center' })
    whiteout(w, 355, 279, 108, 27.5)
    at(w, 'Doors, hatches, cargo or', 356.8, 290.2, { size: 7.7 })
    at(w, 'living area', 356.8, 300, { size: 7.7 })
  }
  if (v.kmOut) at(w, v.kmOut, 469.1, 414.7, { size: 7.5, width: 44, align: 'center' })
}

// ── Annex B: driver list ─────────────────────────────────────────────────────

function fillAnnexB(w: Writer, data: RentalContractData, number: string, layout: TemplateName, vehicles: ContractVehicle[]) {
  if (layout === 'single') {
    at(w, number, 379.8, 79, { size: 9, bold: true })
    at(w, vehicles[0]?.regNo ?? '', 477.5, 79, { size: 9, bold: true, width: 80 })
  }
  else {
    at(w, fmtDate(data.agreementDate), 345.7, 79, { size: 9, bold: true })
    at(w, data.renter.name, 443.5, 79, { size: 8, bold: true, width: 114 })
  }
  at(w, data.renter.name, 34, 164, { width: 170 })
  at(w, data.annexBContact, 213, 164, { width: 170 })
  at(w, data.annexBProject, 391.9, 164, { width: 168 })
  // Footer: "Attached to agreement no. ___" (single) / "…agreement dated ___" (multi).
  at(w, layout === 'single' ? number : fmtDate(data.agreementDate), layout === 'single' ? 421 : 440, 822.9, { size: 6.4 })

  // The first three drivers are on page 1; the rest continue here.
  data.drivers.slice(3, 18).forEach((d, i) => {
    const y = 197.2 + i * 23.25
    at(w, d.name, 57.4, y, { width: 88 })
    at(w, d.idNo, 149.4, y, { width: 80 })
    at(w, d.licenceNo, 232.6, y, { width: 76 })
    at(w, d.issuingCountry, 312.0, y, { width: 66 })
    at(w, d.expiry, 381.6, y, { width: 45 })
    at(w, d.phone, 429.7, y, { width: 53 })
  })
}
