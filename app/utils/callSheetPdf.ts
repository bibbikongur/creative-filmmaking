// Client-side PDF export for the call-sheet tool. A production call sheet:
// dark title band (matching the recce/location-map chrome) with the crew call
// time called out big on the right, a weather/sun strip, numbered locations
// with clickable map links, a timed schedule, a crew table grouped in columns
// and a contacts + safety block. Built-in Helvetica covers Icelandic (WinAnsi).

import type { PDFFont, PDFPage } from 'pdf-lib'
import { PDFDocument, PDFString, StandardFonts, rgb } from 'pdf-lib'

export interface CallSheetLocation {
  name: string
  address: string
  notes: string
  /** Optional maps URL — rendered as a clickable link. */
  link: string
}

export interface CallSheetRow {
  /** "HH:MM" (free text, may be empty). */
  time: string
  label: string
  detail: string
}

export interface CallSheetCrew {
  /** Individual call time "HH:MM" (may be empty — falls back to nothing). */
  call: string
  name: string
  role: string
  dept: string
  phone: string
}

export interface CallSheetContact {
  name: string
  role: string
  phone: string
}

export interface CallSheetDoc {
  production: string
  /** E.g. "Tökudagur 3 af 12". */
  dayLabel: string
  /** Headline crew call time "HH:MM" (may be empty). */
  crewCall: string
  /** Free-form note under the header. */
  note: string
  weather: string
  sunrise: string
  sunset: string
  locations: CallSheetLocation[]
  schedule: CallSheetRow[]
  crew: CallSheetCrew[]
  contacts: CallSheetContact[]
  /** Hospital / emergency / safety note. */
  safety: string
}

export interface CallSheetLabels {
  /** Sheet type, e.g. "Call sheet". */
  callSheet: string
  /** Caption over the big call time, e.g. "Crew call". */
  crewCall: string
  sunrise: string
  sunset: string
  locations: string
  schedule: string
  crew: string
  colCall: string
  colName: string
  colRole: string
  colDept: string
  colPhone: string
  contacts: string
  safety: string
  /** Label for map links, e.g. "Kort". */
  mapLink: string
  /** Suffix on continuation-page headers, e.g. "framhald". */
  continued: string
  /** Pre-formatted, localized date string (may be empty). */
  dateText: string
}

// A4 portrait in PDF points.
const PAGE_W = 595.28
const PAGE_H = 841.89
const M = 50
const BOTTOM = 64 // reserved footer zone

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

// Brand palette: band + gold headline like the recce PDF chrome.
const BAND = hex('#161616')
const TITLE_GOLD = hex('#F2E18C')
const CREAM = hex('#F5F2E9')
const GOLD = hex('#A87A1F')
const INK = hex('#1A1A1F')
const SOFT = hex('#44444C')
const GRAY = hex('#6B6B74')
const LINE = hex('#DDDAD2')

/** Characters above U+00FF that WinAnsi (cp1252) can still encode. */
const CP1252_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')

/** Drop anything Helvetica/WinAnsi can't encode so drawText never throws. */
const safe = (s: string): string =>
  [...s.normalize('NFC')].filter(c => c.charCodeAt(0) < 0x100 || CP1252_EXTRA.has(c)).join('')

/** Greedy word wrap; hard-breaks words wider than the column. */
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

/** Short display form of a URL, e.g. "maps.app.goo.gl". */
const linkHost = (url: string): string => {
  try {
    return new URL(url).host
  }
  catch {
    return url.length > 40 ? `${url.slice(0, 37)}...` : url
  }
}

export async function exportCallSheetPdf(input: CallSheetDoc, labels: CallSheetLabels): Promise<Uint8Array> {
  // Sanitize every string once so the layout code below can draw freely.
  const doc: CallSheetDoc = {
    production: safe(input.production.trim()) || 'CALL SHEET',
    dayLabel: safe(input.dayLabel.trim()),
    crewCall: safe(input.crewCall.trim()),
    note: safe(input.note.trim()),
    weather: safe(input.weather.trim()),
    sunrise: safe(input.sunrise.trim()),
    sunset: safe(input.sunset.trim()),
    locations: input.locations
      .map(l => ({ name: safe(l.name.trim()), address: safe(l.address.trim()), notes: safe(l.notes.trim()), link: l.link.trim() }))
      .filter(l => l.name || l.address || l.notes),
    schedule: input.schedule
      .map(r => ({ time: safe(r.time.trim()), label: safe(r.label.trim()), detail: safe(r.detail.trim()) }))
      .filter(r => r.label || r.detail),
    crew: input.crew
      .map(c => ({ call: safe(c.call.trim()), name: safe(c.name.trim()), role: safe(c.role.trim()), dept: safe(c.dept.trim()), phone: safe(c.phone.trim()) }))
      .filter(c => c.name),
    contacts: input.contacts
      .map(c => ({ name: safe(c.name.trim()), role: safe(c.role.trim()), phone: safe(c.phone.trim()) }))
      .filter(c => c.name),
    safety: safe(input.safety.trim()),
  }
  const dateText = safe(labels.dateText)

  const pdf = await PDFDocument.create()
  pdf.setTitle(`${doc.production}${doc.dayLabel ? ` - ${doc.dayLabel}` : ''}`)
  const reg = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  let page: PDFPage = pdf.addPage([PAGE_W, PAGE_H])
  // All layout runs top-down; `text` converts to PDF's bottom-up coordinates.
  const text = (p: PDFPage, s: string, x: number, baselineTop: number, font: PDFFont, size: number, color = INK) =>
    p.drawText(s, { x, y: PAGE_H - baselineTop, size, font, color })

  // ── Page-1 header band ─────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: PAGE_H - 104, width: PAGE_W, height: 104, color: BAND })
  // The big call time sits right; the title shrinks to leave room for it.
  const callW = doc.crewCall ? Math.max(bold.widthOfTextAtSize(doc.crewCall, 26), reg.widthOfTextAtSize(labels.crewCall.toUpperCase(), 8)) + 24 : 0
  const title = doc.production.toUpperCase()
  let titleSize = 24
  while (titleSize > 12 && bold.widthOfTextAtSize(title, titleSize) > PAGE_W - 2 * M - callW) titleSize -= 1
  text(page, title, M, 58, bold, titleSize, TITLE_GOLD)
  const sub = [labels.callSheet.toUpperCase(), doc.dayLabel.toUpperCase(), dateText].filter(Boolean).join('  ·  ')
  if (sub) text(page, sub, M, 80, bold, 10.5, CREAM)
  if (doc.crewCall) {
    const capW = reg.widthOfTextAtSize(labels.crewCall.toUpperCase(), 8)
    const timeW = bold.widthOfTextAtSize(doc.crewCall, 26)
    text(page, labels.crewCall.toUpperCase(), PAGE_W - M - capW, 44, reg, 8, TITLE_GOLD)
    text(page, doc.crewCall, PAGE_W - M - timeW, 74, bold, 26, CREAM)
  }

  let yTop = 104 + 26

  // ── Weather / sun strip ────────────────────────────────────────────────────
  const strip = [
    doc.weather,
    doc.sunrise ? `${labels.sunrise} ${doc.sunrise}` : '',
    doc.sunset ? `${labels.sunset} ${doc.sunset}` : '',
  ].filter(Boolean).join('   ·   ')
  if (strip) {
    text(page, strip, M, yTop, reg, 9.5, GRAY)
    yTop += 16
  }

  // ── General note ───────────────────────────────────────────────────────────
  if (doc.note) {
    for (const line of wrap(doc.note, reg, 9.5, PAGE_W - 2 * M)) {
      text(page, line, M, yTop, reg, 9.5, SOFT)
      yTop += 13.5
    }
    yTop += 4
  }

  // Continuation pages get a slim header instead of the full band.
  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H])
    const head = `${title}${doc.dayLabel ? ` · ${doc.dayLabel}` : ''} (${labels.continued})`
    text(page, head, M, 42, bold, 10, INK)
    page.drawLine({ start: { x: M, y: PAGE_H - 50 }, end: { x: PAGE_W - M, y: PAGE_H - 50 }, thickness: 1, color: GOLD })
    yTop = 72
  }

  const ensureSpace = (h: number) => {
    if (yTop + h > PAGE_H - BOTTOM) newPage()
  }

  /** Gold section heading with a hairline under it. */
  const sectionHead = (label: string) => {
    ensureSpace(64) // never orphan a heading at the very bottom
    yTop += 12
    text(page, label.toUpperCase(), M, yTop, bold, 8.5, GOLD)
    yTop += 6
    page.drawLine({ start: { x: M, y: PAGE_H - yTop }, end: { x: PAGE_W - M, y: PAGE_H - yTop }, thickness: 0.5, color: LINE })
    yTop += 16
  }

  // ── Locations ──────────────────────────────────────────────────────────────
  if (doc.locations.length) {
    sectionHead(labels.locations)
    const CONTENT_X = M + 26
    const CONTENT_W = PAGE_W - M - CONTENT_X
    doc.locations.forEach((loc, idx) => {
      const nameLines = wrap(loc.name || '·', bold, 10.5, CONTENT_W)
      const addrLines = loc.address ? wrap(loc.address, reg, 9, CONTENT_W) : []
      const noteLines = loc.notes ? wrap(loc.notes, reg, 9, CONTENT_W) : []
      const h = nameLines.length * 13.5 + addrLines.length * 12 + noteLines.length * 12 + (loc.link ? 13 : 0) + 10
      ensureSpace(h)
      text(page, String(idx + 1), M + 2, yTop, bold, 10.5, GOLD)
      let cy = yTop
      for (const line of nameLines) {
        text(page, line, CONTENT_X, cy, bold, 10.5, INK)
        cy += 13.5
      }
      for (const line of addrLines) {
        text(page, line, CONTENT_X, cy, reg, 9, GRAY)
        cy += 12
      }
      for (const line of noteLines) {
        text(page, line, CONTENT_X, cy, reg, 9, SOFT)
        cy += 12
      }
      if (loc.link) {
        const label = `${labels.mapLink}: ${safe(linkHost(loc.link))}`
        text(page, label, CONTENT_X, cy + 1, bold, 8.5, GOLD)
        // Clickable link annotation over the label (kept non-fatal).
        try {
          const w = bold.widthOfTextAtSize(label, 8.5)
          const ref = pdf.context.register(pdf.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [CONTENT_X - 1, PAGE_H - (cy + 4), CONTENT_X + w + 1, PAGE_H - cy + 9],
            Border: [0, 0, 0],
            A: { Type: 'Action', S: 'URI', URI: PDFString.of(loc.link) },
          }))
          page.node.addAnnot(ref)
        }
        catch { /* label only */ }
        cy += 13
      }
      yTop = cy + 10
    })
  }

  // ── Schedule ───────────────────────────────────────────────────────────────
  if (doc.schedule.length) {
    sectionHead(labels.schedule)
    const CONTENT_X = M + 60
    const CONTENT_W = PAGE_W - M - CONTENT_X
    for (const row of doc.schedule) {
      const labelLines = wrap(row.label || '·', bold, 10, CONTENT_W)
      const detailLines = row.detail ? wrap(row.detail, reg, 9, CONTENT_W) : []
      const h = labelLines.length * 13 + detailLines.length * 12 + 7
      ensureSpace(h)
      if (row.time) text(page, row.time, M, yTop, bold, 10, INK)
      let cy = yTop
      for (const line of labelLines) {
        text(page, line, CONTENT_X, cy, bold, 10, INK)
        cy += 13
      }
      for (const line of detailLines) {
        text(page, line, CONTENT_X, cy, reg, 9, SOFT)
        cy += 12
      }
      yTop = cy + 7
    }
  }

  // ── Crew table ─────────────────────────────────────────────────────────────
  if (doc.crew.length) {
    sectionHead(labels.crew)
    // call | name | role | dept | phone
    const X = [M, M + 44, M + 190, M + 316, M + 412]
    const W = [40, 138, 118, 88, PAGE_W - M - X[4]!]
    const header = () => {
      const caps = [labels.colCall, labels.colName, labels.colRole, labels.colDept, labels.colPhone]
      caps.forEach((c, i) => text(page, c.toUpperCase(), X[i]!, yTop, reg, 7.5, GRAY))
      yTop += 14
    }
    header()
    for (const c of doc.crew) {
      const nameLines = wrap(c.name, bold, 9.5, W[1]!)
      const roleLines = c.role ? wrap(c.role, reg, 9, W[2]!) : []
      const deptLines = c.dept ? wrap(c.dept, reg, 9, W[3]!) : []
      const rowH = Math.max(nameLines.length, roleLines.length, deptLines.length, 1) * 12 + 5
      if (yTop + rowH > PAGE_H - BOTTOM) {
        newPage()
        header()
      }
      if (c.call) text(page, c.call, X[0]!, yTop, bold, 9.5, INK)
      nameLines.forEach((l, i) => text(page, l, X[1]!, yTop + i * 12, bold, 9.5, INK))
      roleLines.forEach((l, i) => text(page, l, X[2]!, yTop + i * 12, reg, 9, SOFT))
      deptLines.forEach((l, i) => text(page, l, X[3]!, yTop + i * 12, reg, 9, GRAY))
      if (c.phone) text(page, c.phone, X[4]!, yTop, reg, 9, SOFT)
      yTop += rowH
      page.drawLine({ start: { x: M, y: PAGE_H - (yTop - 3) }, end: { x: PAGE_W - M, y: PAGE_H - (yTop - 3) }, thickness: 0.4, color: LINE })
      yTop += 4
    }
  }

  // ── Contacts ───────────────────────────────────────────────────────────────
  if (doc.contacts.length) {
    sectionHead(labels.contacts)
    for (const c of doc.contacts) {
      ensureSpace(15)
      text(page, c.name, M, yTop, bold, 9.5, INK)
      const rest = [c.role, c.phone].filter(Boolean).join(' · ')
      if (rest) text(page, `· ${rest}`, M + bold.widthOfTextAtSize(c.name, 9.5) + 6, yTop, reg, 9.5, GRAY)
      yTop += 15
    }
  }

  // ── Safety ─────────────────────────────────────────────────────────────────
  if (doc.safety) {
    sectionHead(labels.safety)
    for (const line of wrap(doc.safety, reg, 9.5, PAGE_W - 2 * M)) {
      ensureSpace(14)
      text(page, line, M, yTop, reg, 9.5, SOFT)
      yTop += 13.5
    }
  }

  // ── Footer on every page ───────────────────────────────────────────────────
  const pages = pdf.getPages()
  const foot = safe(`${title}${doc.dayLabel ? ` · ${doc.dayLabel}` : ''}${dateText ? ` · ${dateText}` : ''}`)
  pages.forEach((p, i) => {
    p.drawText(foot, { x: M, y: 32, size: 7.5, font: reg, color: GRAY })
    const num = `${i + 1} / ${pages.length}`
    p.drawText(num, { x: PAGE_W - M - reg.widthOfTextAtSize(num, 7.5), y: 32, size: 7.5, font: reg, color: GRAY })
  })

  return pdf.save()
}
