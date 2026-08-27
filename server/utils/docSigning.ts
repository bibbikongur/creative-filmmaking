import { createHash } from 'node:crypto'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { TemplateField, TemplateFieldType } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Stamps a signed contract/NDA: writes the member's data at the admin-placed
// field positions, draws the hand-drawn signature, and appends an audit line
// (who, when, from where, hash of the original document). Fields are PDF
// points with a top-left origin; pdf-lib draws from the bottom-left, so y is
// flipped against the page height here and nowhere else.
// ─────────────────────────────────────────────────────────────────────────────

export interface SignValues {
  name: string
  role?: string
  email: string
  phone?: string
  dayRate: number
  /** YYYY-MM-DD the document was sent, for 'date' fields. */
  sentDate: string
}

/** Text stamped for a data field. Pure, unit-tested. */
export function fieldValue(type: TemplateFieldType, values: SignValues, signedDate: string): string {
  switch (type) {
    case 'name': return values.name
    case 'role': return values.role ?? ''
    case 'email': return values.email
    case 'phone': return values.phone ?? ''
    case 'dayRate': return `${values.dayRate.toLocaleString('is-IS')} kr.`
    case 'date': return values.sentDate
    case 'dateSigned': return signedDate
    default: return ''
  }
}

/** Helvetica is WinAnsi-only; Icelandic fits, anything else becomes '?'. */
const winAnsiSafe = (s: string) => s.replace(/[^\x20-\x7E -ÿ]/g, '?')

const dataUrlToPng = (dataUrl: string): Buffer => {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!m) {
    throw createError({ statusCode: 400, statusMessage: 'Signature must be a PNG image.' })
  }
  return Buffer.from(m[1]!, 'base64')
}

export async function stampSignedPdf(input: {
  pdf: Buffer
  fields: TemplateField[]
  values: SignValues
  /** data:image/png;base64,… from the signature canvas. */
  signaturePng: string
  signedName: string
  signedAt: Date
  ip: string
}): Promise<Buffer> {
  const doc = await PDFDocument.load(input.pdf)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique)
  const signature = await doc.embedPng(dataUrlToPng(input.signaturePng))
  const signedDate = input.signedAt.toISOString().slice(0, 10)
  const ink = rgb(0.1, 0.1, 0.12)

  let signaturePage = doc.getPageCount() - 1
  for (const f of input.fields) {
    const page = doc.getPage(Math.min(f.page, doc.getPageCount()) - 1)
    const pageH = page.getHeight()
    if (f.type === 'signature') {
      signaturePage = Math.min(f.page, doc.getPageCount()) - 1
      // Fit the drawn signature inside the field, preserving aspect ratio.
      const scale = Math.min(f.w / signature.width, f.h / signature.height)
      const w = signature.width * scale
      const h = signature.height * scale
      page.drawImage(signature, {
        x: f.x + (f.w - w) / 2,
        y: pageH - f.y - f.h + (f.h - h) / 2,
        width: w,
        height: h,
      })
    }
    else {
      const size = Math.min(9, Math.max(6, f.h * 0.6))
      page.drawText(winAnsiSafe(fieldValue(f.type, input.values, signedDate)), {
        x: f.x + 2,
        y: pageH - f.y - f.h + (f.h - size) / 2 + 1,
        size,
        font,
        color: ink,
      })
    }
  }

  // Audit line at the foot of the signature page — the evidence trail that
  // makes a simple electronic signature hold up: who, when, from where, and
  // a fingerprint of the exact document that was signed.
  const docHash = createHash('sha256').update(input.pdf).digest('hex')
  const audit = `Undirritað rafrænt / signed electronically: ${input.signedName} <${input.values.email}> · ${input.signedAt.toISOString()} · IP ${input.ip} · SHA-256 ${docHash.slice(0, 32)}`
  const page = doc.getPage(signaturePage)
  page.drawText(winAnsiSafe(audit), {
    x: 24,
    y: 12,
    size: 6.5,
    font: italic,
    color: rgb(0.45, 0.45, 0.45),
    maxWidth: page.getWidth() - 48,
    lineHeight: 8,
  })

  return Buffer.from(await doc.save())
}
