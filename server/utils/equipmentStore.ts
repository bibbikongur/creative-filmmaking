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
  const insert = db.prepare('INSERT INTO equipment (id, sort, data) VALUES (?, ?, ?)')
  db.transaction(() => {
    db.prepare('DELETE FROM equipment').run()
    items.forEach((e, i) => insert.run(e.id, i, JSON.stringify(e)))
  })()
}

// ── Payload validation ───────────────────────────────────────────────────────

const CATEGORIES: EquipmentCategory[] = ['heating', 'shelter', 'safety', 'furniture']

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
  }
}
