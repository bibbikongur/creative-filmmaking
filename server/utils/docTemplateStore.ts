import { randomBytes } from 'node:crypto'
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DocKind, DocTemplateMeta, TemplateField, TemplateFieldType } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Contract/NDA templates: one PDF per (job, kind) with admin-placed fields.
// PDFs live in <dataDir>/doc-templates (private; streamed only through a
// requireJobAdmin endpoint). Field coordinates are PDF points (72dpi) with the
// origin at the top-left of the page; docSigning flips y when stamping.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FIELDS = 100
const FIELD_TYPES: TemplateFieldType[] = ['name', 'role', 'email', 'phone', 'dayRate', 'date', 'signature', 'dateSigned']

export const DOC_KINDS: DocKind[] = ['contract', 'nda']

export function parseDocKind(value: unknown): DocKind {
  if (value !== 'contract' && value !== 'nda') {
    throw createError({ statusCode: 404, statusMessage: 'Unknown document kind.' })
  }
  return value
}

function rowToMeta(r: Record<string, unknown>): DocTemplateMeta {
  return {
    kind: r.kind as DocKind,
    originalName: r.original_name as string,
    pageCount: (r.page_count as number) ?? 0,
    uploadedAt: r.created_at as string,
    fields: JSON.parse((r.fields as string) || '[]') as TemplateField[],
  }
}

export function getTemplates(jobId: string): { contract?: DocTemplateMeta, nda?: DocTemplateMeta } {
  const rows = getDb().prepare('SELECT * FROM doc_templates WHERE job_id = ?').all(jobId) as Record<string, unknown>[]
  const out: { contract?: DocTemplateMeta, nda?: DocTemplateMeta } = {}
  for (const r of rows) out[r.kind as DocKind] = rowToMeta(r)
  return out
}

export function getTemplate(jobId: string, kind: DocKind): (DocTemplateMeta & { fileName: string }) | null {
  const row = getDb().prepare('SELECT * FROM doc_templates WHERE job_id = ? AND kind = ?')
    .get(jobId, kind) as Record<string, unknown> | undefined
  return row ? { ...rowToMeta(row), fileName: row.file_name as string } : null
}

export function templateFilePath(fileName: string): string {
  return join(docTemplatesDir(), fileName)
}

/** Store an uploaded template PDF. Replacing clears the placed fields. */
export function saveTemplate(jobId: string, kind: DocKind, input: { data: Buffer, originalName: string }): DocTemplateMeta {
  if (input.data.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: ['Only PDF files are accepted.'] },
    })
  }

  const db = getDb()
  const fileName = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}.pdf`
  mkdirSync(docTemplatesDir(), { recursive: true })
  writeFileSync(templateFilePath(fileName), input.data)

  const existing = getTemplate(jobId, kind)
  if (existing) {
    db.prepare('UPDATE doc_templates SET created_at = ?, file_name = ?, original_name = ?, page_count = 0, fields = \'[]\' WHERE job_id = ? AND kind = ?')
      .run(new Date().toISOString(), fileName, input.originalName, jobId, kind)
    try {
      unlinkSync(templateFilePath(existing.fileName))
    }
    catch { /* already gone — nothing to clean up */ }
  }
  else {
    db.prepare('INSERT INTO doc_templates (id, job_id, kind, created_at, file_name, original_name) VALUES (?, ?, ?, ?, ?, ?)')
      .run(newPortalId('t'), jobId, kind, new Date().toISOString(), fileName, input.originalName)
  }
  const { fileName: _internal, ...meta } = getTemplate(jobId, kind)!
  return meta
}

export function saveFields(jobId: string, kind: DocKind, fields: TemplateField[], pageCount?: number): DocTemplateMeta | null {
  const db = getDb()
  if (!getTemplate(jobId, kind)) return null
  db.prepare('UPDATE doc_templates SET fields = ? WHERE job_id = ? AND kind = ?')
    .run(JSON.stringify(fields), jobId, kind)
  if (pageCount && Number.isInteger(pageCount) && pageCount > 0 && pageCount <= 500) {
    db.prepare('UPDATE doc_templates SET page_count = ? WHERE job_id = ? AND kind = ?')
      .run(pageCount, jobId, kind)
  }
  const { fileName: _internal, ...meta } = getTemplate(jobId, kind)!
  return meta
}

/** Validate client-supplied fields. Pure (no DB) so it's unit-testable. */
export function validateFields(input: unknown): TemplateField[] {
  if (!Array.isArray(input) || input.length > MAX_FIELDS) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: [`Fields must be a list of at most ${MAX_FIELDS} entries.`] },
    })
  }
  return input.map((raw, i) => {
    const f = (raw ?? {}) as Record<string, unknown>
    const type = f.type as TemplateFieldType
    const page = Number(f.page)
    const nums = [f.x, f.y, f.w, f.h].map(Number)
    const ok = FIELD_TYPES.includes(type)
      && Number.isInteger(page) && page >= 1 && page <= 500
      && nums.every(n => Number.isFinite(n) && n >= 0 && n <= 5000)
    if (!ok) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: [`Field ${i + 1} is invalid.`] },
      })
    }
    const [x, y, w, h] = nums as [number, number, number, number]
    return {
      id: typeof f.id === 'string' && f.id ? f.id.slice(0, 40) : `f-${randomBytes(4).toString('hex')}`,
      type,
      page,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      w: Math.round(w * 100) / 100,
      h: Math.round(h * 100) / 100,
    }
  })
}
