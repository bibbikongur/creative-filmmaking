import type { EquipmentCategory, EquipmentItem, LocalizedText } from '~~/app/types'
import { SLUG_RE, equipmentSlug, isReservedEquipmentSlug } from '~~/app/utils/equipmentSlug'

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

  // Optional: empty means "derive from the Icelandic name" (legacy behaviour).
  const slug = asText(b.slug).toLowerCase()
  if (slug && !SLUG_RE.test(slug)) errors.push('Slug must be lowercase letters and numbers separated by dashes (e.g. rafstod-2-2-kva).')
  if (slug && isReservedEquipmentSlug(slug)) errors.push(`"${slug}" is the address of a category page and can't be used as an item slug.`)

  const tagline = asLocalized(b.tagline)
  const description = asLocalized(b.description)

  const highlights = (Array.isArray(b.highlights) ? b.highlights : [])
    .map(asLocalized)
    .filter(h => h.en || h.is)

  const images = (Array.isArray(b.images) ? b.images : [])
    .map(asText)
    .filter(src => /^(https?:\/\/|\/)/.test(src))
  if (!images.length) errors.push('At least one image is required.')

  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors } })
  }

  return {
    ...(slug ? { slug } : {}),
    category: category!,
    name,
    tagline,
    ...(description.en || description.is ? { description } : {}),
    ...(highlights.length ? { highlights } : {}),
    images,
    featured: b.featured === true,
  }
}

/**
 * Two items may never resolve to the same URL. Compares the slug the candidate
 * would get against every other item's, derived or explicit.
 */
export function assertUniqueEquipmentSlug(candidate: Pick<EquipmentItem, 'id' | 'name' | 'slug'>, others: EquipmentItem[]) {
  const slug = equipmentSlug(candidate)
  const clash = others.find(o => o.id !== candidate.id && equipmentSlug(o) === slug)
  if (clash) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: [`The address /equipment/${slug} is already used by "${clash.name.en}". Pick a different slug.`] },
    })
  }
}
