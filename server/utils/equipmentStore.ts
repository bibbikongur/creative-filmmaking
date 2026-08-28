import type { EquipmentCategory, EquipmentItem, LocalizedText } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Runtime equipment store — rows in the SQLite database (see db.ts), stored
// as JSON documents so this API stays a plain EquipmentItem[] in/out. The
// admin panel edits the database; app/data/equipment.ts is only the seed.
// ─────────────────────────────────────────────────────────────────────────────

export async function getEquipment(): Promise<EquipmentItem[]> {
  const rows = getDb().prepare('SELECT data FROM equipment ORDER BY sort').all() as { data: string }[]
  return rows.map(r => JSON.parse(r.data) as EquipmentItem)
}

export async function saveEquipment(items: EquipmentItem[]) {
  const db = getDb()
  // Full rewrite, but updated_at must survive it: keep the old stamp when a
  // row's JSON is byte-identical, stamp now when it changed or is new. The
  // sitemap turns these into lastmod.
  const prev = new Map(
    (db.prepare('SELECT id, data, updated_at FROM equipment').all() as { id: string, data: string, updated_at: string | null }[])
      .map(r => [r.id, r]),
  )
  const now = new Date().toISOString()
  const insert = db.prepare('INSERT INTO equipment (id, sort, data, updated_at) VALUES (?, ?, ?, ?)')
  db.transaction(() => {
    db.prepare('DELETE FROM equipment').run()
    items.forEach((e, i) => {
      const json = JSON.stringify(e)
      const old = prev.get(e.id)
      insert.run(e.id, i, json, old && old.data === json ? old.updated_at : now)
    })
  })()
}

// ── Payload validation ───────────────────────────────────────────────────────

const CATEGORIES: EquipmentCategory[] = ['heating', 'shelter', 'safety', 'furniture', 'power', 'cleaning']

const asText = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

const asLocalized = (v: unknown): LocalizedText => {
  const o = (v ?? {}) as Record<string, unknown>
  return { en: asText(o.en), is: asText(o.is) }
}

const oneOf = <T extends string>(options: readonly T[], v: unknown): T | undefined =>
  options.includes(v as T) ? (v as T) : undefined

/** Validate + normalize an admin-submitted equipment item. Throws 400 with a list of errors. */
export function parseEquipmentPayload(body: unknown): Omit<EquipmentItem, 'id'> {
  const b = (body ?? {}) as Record<string, unknown>
  const errors: string[] = []

  const category = oneOf(CATEGORIES, b.category)
  if (!category) errors.push('Category is required.')

  const name = asLocalized(b.name)
  if (!name.en) errors.push('English name is required.')

  const tagline = asLocalized(b.tagline)

  const images = (Array.isArray(b.images) ? b.images : [])
    .map(asText)
    .filter(src => /^(https?:\/\/|\/)/.test(src))
  if (!images.length) errors.push('At least one image is required.')

  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors } })
  }

  return {
    category: category!,
    name,
    tagline,
    images,
    featured: b.featured === true,
  }
}
