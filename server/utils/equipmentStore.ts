import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { equipment as seedEquipment } from '~~/app/data/equipment'
import type { EquipmentCategory, EquipmentItem, LocalizedText } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Runtime equipment store — a JSON file in the data dir, seeded once from
// app/data/equipment.ts. The admin panel edits this file; the static TS file
// is only the initial content. Shares dataDir()/uploadsDir() with the fleet
// store, so the same NUXT_DATA_DIR volume holds both in production.
// ─────────────────────────────────────────────────────────────────────────────

const storeFile = () => join(dataDir(), 'equipment.json')

let cache: EquipmentItem[] | null = null

export async function getEquipment(): Promise<EquipmentItem[]> {
  if (cache) return cache
  try {
    cache = JSON.parse(await fs.readFile(storeFile(), 'utf8')) as EquipmentItem[]
  }
  catch {
    // First run (or unreadable file): seed from the static data file.
    cache = seedEquipment
    await persist(cache).catch(() => {}) // read-only FS shouldn't break the site
  }
  return cache
}

async function persist(items: EquipmentItem[]) {
  await fs.mkdir(dataDir(), { recursive: true })
  const tmp = `${storeFile()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), 'utf8')
  await fs.rename(tmp, storeFile())
}

export async function saveEquipment(items: EquipmentItem[]) {
  cache = items
  await persist(items)
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
