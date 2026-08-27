// Client-side PDF export for the recce-plan tool. A timed tech-recce schedule:
// dark title band (matching the location-map chrome), a gold timeline of stops
// with arrival/departure times, wrapped notes, clickable map links and a
// contact list. Built-in Helvetica covers Icelandic (ð/þ/æ/ö are WinAnsi).

import type { PDFFont, PDFPage } from 'pdf-lib'
import { PDFDocument, PDFString, StandardFonts, rgb } from 'pdf-lib'

export interface RecceStop {
  /** Arrival time "HH:MM" (computed by the page from start + durations). */
  time: string
  /** Departure time "HH:MM" (may be empty when the stop has no duration). */
  endTime: string
  name: string
  address: string
  notes: string
  /** Optional maps URL — rendered as a clickable link. */
  link: string
  /** Pre-formatted drive time to the NEXT stop, e.g. "30 mín keyrsla". */
  travel: string
  /** Up to 2 JPEG data URLs, shown left of the stop's text. */
  photos: string[]
}

export interface RecceContact {
  name: string
  role: string
  phone: string
}

export interface RecceDoc {
  project: string
  /** Sub-heading, e.g. "Tech recce". */
  subtitle: string
  /** ISO date from the date input (may be empty). */
  date: string
  /** Free-form note shown under the header (meeting point, weather...). */
  note: string
  stops: RecceStop[]
  contacts: RecceContact[]
  /** Optional overview-map page (JPEG data URL from renderRecceOverviewMap). */
  overviewMap?: { image: string } | null
}

export interface RecceLabels {
  /** Heading for the contact block. */
  contacts: string
  /** Label for map links, e.g. "Kort". */
  mapLink: string
  /** Suffix on continuation-page headers, e.g. "framhald". */
  continued: string
  /** Pre-formatted, localized date string (may be empty). */
  dateText: string
  /** Heading for the overview-map page, e.g. "Yfirlitskort". */
  mapTitle: string
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

// Brand palette: deep-navy title band with a gold headline, gold-600 accents
// on white like the offer PDF.
const BAND = hex('#1B2A4A')
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

export async function exportReccePdf(input: RecceDoc, labels: RecceLabels): Promise<Uint8Array> {
  // Sanitize every string once so the layout code below can draw freely.
  const doc: RecceDoc = {
    project: safe(input.project.trim()) || 'RECCE',
    subtitle: safe(input.subtitle.trim()),
    date: input.date,
    note: safe(input.note.trim()),
    stops: input.stops.map(s => ({
      time: safe(s.time),
      endTime: safe(s.endTime),
      name: safe(s.name.trim()),
      address: safe(s.address.trim()),
      notes: safe(s.notes.trim()),
      link: s.link.trim(),
      travel: safe(s.travel.trim()),
      photos: (s.photos ?? []).slice(0, 2),
    })),
    contacts: input.contacts
      .map(c => ({ name: safe(c.name.trim()), role: safe(c.role.trim()), phone: safe(c.phone.trim()) }))
      .filter(c => c.name),
    overviewMap: input.overviewMap ?? null,
  }
  const dateText = safe(labels.dateText)

  const pdf = await PDFDocument.create()
  pdf.setTitle(`${doc.project}${doc.subtitle ? ` - ${doc.subtitle}` : ''}`)
  const reg = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique)

  // Stop photos are embedded up front; a corrupt image is skipped, not fatal.
  const stopPhotos = await Promise.all(doc.stops.map(s =>
    Promise.all(s.photos.map(p => pdf.embedJpg(p).catch(() => null)))
      .then(imgs => imgs.filter(im => im !== null)),
  ))

  let page: PDFPage = pdf.addPage([PAGE_W, PAGE_H])
  // All layout runs top-down; `text` converts to PDF's bottom-up coordinates.
  const text = (p: PDFPage, s: string, x: number, baselineTop: number, font: PDFFont, size: number, color = INK) =>
    p.drawText(s, { x, y: PAGE_H - baselineTop, size, font, color })

  // ── Page-1 header band ─────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: PAGE_H - 104, width: PAGE_W, height: 104, color: BAND })
  const title = doc.project.toUpperCase()
  let titleSize = 24
  while (titleSize > 13 && bold.widthOfTextAtSize(title, titleSize) > PAGE_W - 2 * M) titleSize -= 1
  text(page, title, M, 58, bold, titleSize, TITLE_GOLD)
  const sub = doc.subtitle.toUpperCase()
  if (sub) text(page, sub, M, 80, bold, 10.5, CREAM)
  if (dateText) {
    text(page, dateText, PAGE_W - M - reg.widthOfTextAtSize(dateText, 10.5), 80, reg, 10.5, CREAM)
  }

  let yTop = 104 + 30

  // ── General note ───────────────────────────────────────────────────────────
  if (doc.note) {
    for (const line of wrap(doc.note, reg, 9.5, PAGE_W - 2 * M)) {
      text(page, line, M, yTop, reg, 9.5, SOFT)
      yTop += 13.5
    }
    yTop += 10
  }

  // ── Timeline of stops ──────────────────────────────────────────────────────
  const TIME_X = M
  const DOT_X = M + 70
  const CONTENT_X = M + 90
  const CONTENT_W = PAGE_W - M - CONTENT_X
  const DOT_R = 3.5

  // Continuation pages get a slim header instead of the full band.
  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H])
    const head = `${title}${sub ? ` · ${sub}` : ''} (${labels.continued})`
    text(page, head, M, 42, bold, 10, INK)
    page.drawLine({ start: { x: M, y: PAGE_H - 50 }, end: { x: PAGE_W - M, y: PAGE_H - 50 }, thickness: 1, color: GOLD })
    yTop = 72
    prevDotTop = null
  }

  const ensureSpace = (h: number) => {
    if (yTop + h > PAGE_H - BOTTOM) newPage()
  }

  let prevDotTop: number | null = null

  const PHOTO_H = 72
  doc.stops.forEach((stop, idx) => {
    // Photos sit side by side, right-aligned in the row; the text column keeps
    // the left side and shrinks to make room.
    const photos = stopPhotos[idx]!
    const photoWs = photos.map(im => Math.min(PHOTO_H * (im.width / im.height), 150))
    const photoBlockW = photoWs.length ? photoWs.reduce((a, b) => a + b, 0) + (photoWs.length - 1) * 8 : 0
    const textW = PAGE_W - M - CONTENT_X - (photoBlockW ? photoBlockW + 14 : 0)

    const nameLines = wrap(stop.name || '·', bold, 11, textW)
    const addrLines = stop.address ? wrap(stop.address, reg, 9, textW) : []
    const noteLines = stop.notes ? wrap(stop.notes, reg, 9, textW) : []
    const contentH = nameLines.length * 14 + addrLines.length * 12 + noteLines.length * 12 + (stop.link ? 13 : 0)
    const timeH = stop.endTime ? 26 : 14
    // Drive time to the next stop sits in the gap along the timeline.
    const travel = idx < doc.stops.length - 1 ? stop.travel : ''
    const baseH = Math.max(contentH, photos.length ? PHOTO_H : 0, timeH, 18) + 16
    const stopH = baseH + (travel ? 14 : 0)
    ensureSpace(stopH)

    const rowTop = yTop

    // Connecting timeline segment, then the gold dot on top of it.
    const dotTop = rowTop + 6.5
    if (prevDotTop !== null) {
      page.drawLine({
        start: { x: DOT_X, y: PAGE_H - (prevDotTop + DOT_R + 2) },
        end: { x: DOT_X, y: PAGE_H - (dotTop - DOT_R - 2) },
        thickness: 1.2,
        color: LINE,
      })
    }
    page.drawCircle({ x: DOT_X, y: PAGE_H - dotTop, size: DOT_R, color: GOLD })
    prevDotTop = dotTop

    if (stop.time) text(page, stop.time, TIME_X, rowTop + 10, bold, 11, INK)
    if (stop.endTime) text(page, `– ${stop.endTime}`, TIME_X, rowTop + 23, reg, 8.5, GRAY)

    let px = PAGE_W - M - photoBlockW
    photos.forEach((im, pi) => {
      const w = photoWs[pi]!
      page.drawImage(im, { x: px, y: PAGE_H - (rowTop + PHOTO_H), width: w, height: PHOTO_H })
      page.drawRectangle({
        x: px,
        y: PAGE_H - (rowTop + PHOTO_H),
        width: w,
        height: PHOTO_H,
        borderColor: LINE,
        borderWidth: 0.5,
      })
      px += w + 8
    })

    let cy = rowTop + 10
    for (const line of nameLines) {
      text(page, line, CONTENT_X, cy, bold, 11, INK)
      cy += 14
    }
    cy -= 1
    for (const line of addrLines) {
      text(page, line, CONTENT_X, cy, reg, 9, GRAY)
      cy += 12
    }
    for (const line of noteLines) {
      text(page, line, CONTENT_X, cy, reg, 9, SOFT)
      cy += 12
    }
    if (stop.link) {
      const label = `${labels.mapLink}: ${safe(linkHost(stop.link))}`
      text(page, label, CONTENT_X, cy + 1, bold, 8.5, GOLD)
      // Clickable link annotation over the label (kept non-fatal: a plain
      // label is still useful if the low-level API ever changes).
      try {
        const w = bold.widthOfTextAtSize(label, 8.5)
        const ref = pdf.context.register(pdf.context.obj({
          Type: 'Annot',
          Subtype: 'Link',
          Rect: [CONTENT_X - 1, PAGE_H - (cy + 4), CONTENT_X + w + 1, PAGE_H - cy + 9],
          Border: [0, 0, 0],
          A: { Type: 'Action', S: 'URI', URI: PDFString.of(stop.link) },
        }))
        page.node.addAnnot(ref)
      }
      catch { /* label only */ }
      cy += 13
    }

    if (travel) text(page, travel, CONTENT_X, rowTop + baseH + 2, italic, 8.5, GRAY)

    yTop = rowTop + stopH
  })

  // ── Contacts ───────────────────────────────────────────────────────────────
  if (doc.contacts.length) {
    ensureSpace(34 + doc.contacts.length * 15)
    yTop += 8
    text(page, labels.contacts.toUpperCase(), M, yTop, bold, 8.5, GOLD)
    yTop += 6
    page.drawLine({ start: { x: M, y: PAGE_H - yTop }, end: { x: PAGE_W - M, y: PAGE_H - yTop }, thickness: 0.5, color: LINE })
    yTop += 15
    for (const c of doc.contacts) {
      text(page, c.name, M, yTop, bold, 9.5, INK)
      const rest = [c.role, c.phone].filter(Boolean).join(' · ')
      if (rest) text(page, `· ${rest}`, M + bold.widthOfTextAtSize(c.name, 9.5) + 6, yTop, reg, 9.5, GRAY)
      yTop += 15
    }
  }

  // ── Overview-map page ──────────────────────────────────────────────────────
  if (doc.overviewMap?.image) {
    try {
      const img = await pdf.embedJpg(doc.overviewMap.image)
      page = pdf.addPage([PAGE_W, PAGE_H])
      text(page, safe(labels.mapTitle).toUpperCase(), M, 46, bold, 14, INK)
      page.drawLine({ start: { x: M, y: PAGE_H - 56 }, end: { x: PAGE_W - M, y: PAGE_H - 56 }, thickness: 1, color: GOLD })
      const boxW = PAGE_W - 2 * M
      const boxH = PAGE_H - 76 - BOTTOM
      const sc = Math.min(boxW / img.width, boxH / img.height)
      const w = img.width * sc
      const h = img.height * sc
      page.drawImage(img, { x: M + (boxW - w) / 2, y: PAGE_H - 76 - h, width: w, height: h })
      page.drawRectangle({
        x: M + (boxW - w) / 2,
        y: PAGE_H - 76 - h,
        width: w,
        height: h,
        borderColor: LINE,
        borderWidth: 0.5,
      })
    }
    catch { /* bad map image — the schedule pages stand alone */ }
  }

  // ── Footer on every page ───────────────────────────────────────────────────
  const pages = pdf.getPages()
  const foot = safe(`${title}${sub ? ` · ${sub}` : ''}${dateText ? ` · ${dateText}` : ''}`)
  pages.forEach((p, i) => {
    p.drawText(foot, { x: M, y: 32, size: 7.5, font: reg, color: GRAY })
    const num = `${i + 1} / ${pages.length}`
    p.drawText(num, { x: PAGE_W - M - reg.widthOfTextAtSize(num, 7.5), y: 32, size: 7.5, font: reg, color: GRAY })
  })

  return pdf.save()
}
