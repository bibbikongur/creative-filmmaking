import type { EquipmentCategoryDef, EquipmentItem, LocalizedText } from '~~/app/types'
import { SLUG_RE, equipmentSlug, slugify } from '~~/app/utils/equipmentSlug'

// ─────────────────────────────────────────────────────────────────────────────
// Equipment categories — rows in the SQLite database, stored as JSON documents
// (see db.ts for the table and the one-time seed from the original six).
// Managed in /admin/equipment/categories.
// ─────────────────────────────────────────────────────────────────────────────

type Row = { id: string, sort: number, status: string, data: string, updated_at: string | null }

const fromRow = (r: Row): EquipmentCategoryDef => {
  const d = JSON.parse(r.data) as Omit<EquipmentCategoryDef, 'id' | 'sort' | 'status' | 'updatedAt'>
  return {
    ...d,
    id: r.id,
    sort: r.sort,
    status: r.status === 'archived' ? 'archived' : 'active',
    ...(r.updated_at ? { updatedAt: r.updated_at } : {}),
  }
}

const toData = (c: EquipmentCategoryDef) => {
  const { id: _id, sort: _sort, status: _status, updatedAt: _u, ...data } = c
  return JSON.stringify(data)
}

export async function getEquipmentCategories(includeArchived = false): Promise<EquipmentCategoryDef[]> {
  const rows = getDb()
    .prepare(`SELECT id, sort, status, data, updated_at FROM equipment_categories ${includeArchived ? '' : "WHERE status = 'active'"} ORDER BY sort`)
    .all() as Row[]
  return rows.map(fromRow)
}

export async function getEquipmentCategory(id: string): Promise<EquipmentCategoryDef | undefined> {
  const row = getDb().prepare('SELECT id, sort, status, data, updated_at FROM equipment_categories WHERE id = ?').get(id) as Row | undefined
  return row ? fromRow(row) : undefined
}

export async function upsertEquipmentCategory(c: EquipmentCategoryDef): Promise<EquipmentCategoryDef> {
  const now = new Date().toISOString()
  getDb().prepare(`
    INSERT INTO equipment_categories (id, sort, status, data, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET sort = excluded.sort, status = excluded.status, data = excluded.data, updated_at = excluded.updated_at
  `).run(c.id, c.sort, c.status, toData(c), now)
  return { ...c, updatedAt: now }
}

export async function reorderEquipmentCategories(ids: string[]) {
  const db = getDb()
  const update = db.prepare('UPDATE equipment_categories SET sort = ? WHERE id = ?')
  db.transaction(() => ids.forEach((id, i) => update.run(i, id)))()
}

// ── Validation ───────────────────────────────────────────────────────────────

const asText = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

const asLocalized = (v: unknown): LocalizedText => {
  const o = (v ?? {}) as Record<string, unknown>
  return { en: asText(o.en), is: asText(o.is) }
}

const asParagraphs = (v: unknown): LocalizedText[] => {
  // Accepts either an array of { en, is } or a pair of blank-line separated texts
  if (Array.isArray(v)) return v.map(asLocalized).filter(p => p.en || p.is)
  const o = (v ?? {}) as Record<string, unknown>
  const split = (s: unknown) => asText(s).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
  const en = split(o.en)
  const is = split(o.is)
  const n = Math.max(en.length, is.length)
  return Array.from({ length: n }, (_, i) => ({ en: en[i] ?? '', is: is[i] ?? '' }))
}

/**
 * Validate + normalise an admin-submitted category. `existing` is the stored
 * row when editing (its id and slug history carry over; a changed slug is
 * appended to the history so the old address keeps working).
 */
export function parseEquipmentCategoryPayload(body: unknown, existing?: EquipmentCategoryDef): Omit<EquipmentCategoryDef, 'id' | 'sort' | 'updatedAt'> {
  const b = (body ?? {}) as Record<string, unknown>
  const errors: string[] = []

  const name = asLocalized(b.name)
  if (!name.is) errors.push('Icelandic name is required.')
  if (!name.en) errors.push('English name is required.')

  const slugIn = asLocalized(b.slug)
  const slug: LocalizedText = {
    is: (slugIn.is || slugify(name.is)).toLowerCase(),
    en: (slugIn.en || slugify(name.en)).toLowerCase(),
  }
  for (const code of ['is', 'en'] as const) {
    if (!slug[code]) errors.push(`${code === 'is' ? 'Icelandic' : 'English'} URL slug is required.`)
    else if (!SLUG_RE.test(slug[code])) errors.push(`${code === 'is' ? 'Icelandic' : 'English'} slug must be lowercase letters and numbers separated by dashes.`)
  }

  const title = asLocalized(b.title)
  const metaTitle = asLocalized(b.metaTitle)
  const metaDescription = asLocalized(b.metaDescription)
  const intro = asParagraphs(b.intro)
  const faq = (Array.isArray(b.faq) ? b.faq : [])
    .map((f) => {
      const o = (f ?? {}) as Record<string, unknown>
      return { q: asLocalized(o.q), a: asLocalized(o.a) }
    })
    .filter(f => (f.q.en && f.a.en) || (f.q.is && f.a.is))

  const status = b.status === 'archived' ? 'archived' : 'active'

  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors } })
  }

  // Slug history: every slug the category ever had, minus the current ones.
  const history = new Set(existing?.previousSlugs ?? [])
  if (existing) {
    for (const code of ['is', 'en'] as const) {
      if (existing.slug[code] && existing.slug[code] !== slug[code]) history.add(existing.slug[code])
    }
  }
  history.delete(slug.is)
  history.delete(slug.en)

  return {
    status,
    slug,
    name,
    title: { en: title.en || name.en, is: title.is || name.is },
    metaTitle,
    metaDescription,
    intro,
    faq,
    previousSlugs: [...history],
  }
}

/** Every slug a category answers to, current and former. */
export const categorySlugs = (c: Pick<EquipmentCategoryDef, 'slug' | 'previousSlugs'>): string[] =>
  [c.slug.is, c.slug.en, ...(c.previousSlugs ?? [])].filter(Boolean)

/**
 * A category's addresses may not collide with another category (current or
 * former slugs) or with any item's address.
 */
export function assertUniqueCategorySlugs(
  candidate: Pick<EquipmentCategoryDef, 'id' | 'slug' | 'previousSlugs'>,
  categories: EquipmentCategoryDef[],
  items: EquipmentItem[],
) {
  const errors: string[] = []
  const mine = new Set([candidate.slug.is, candidate.slug.en])
  for (const other of categories) {
    if (other.id === candidate.id) continue
    for (const s of categorySlugs(other)) {
      if (mine.has(s)) errors.push(`The address /equipment/${s} is already used by the category "${other.name.en}".`)
    }
  }
  for (const item of items) {
    const s = equipmentSlug(item)
    if (mine.has(s)) errors.push(`The address /equipment/${s} is already used by the item "${item.name.en}". Pick a different slug.`)
  }
  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors } })
  }
}

/** Item slugs may not take a category's address (current or former). */
export function assertItemSlugFree(slug: string, categories: EquipmentCategoryDef[]) {
  const clash = categories.find(c => categorySlugs(c).includes(slug))
  if (clash) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: [`"${slug}" is the address of the category "${clash.name.en}" and can't be used as an item slug.`] },
    })
  }
}
