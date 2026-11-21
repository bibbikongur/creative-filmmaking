import type Database from 'better-sqlite3'
import type { EquipmentCategoryDef, EquipmentItem, LocalizedText, Vehicle } from '~~/app/types'
import { equipmentSlug } from '~~/app/utils/equipmentSlug'
import copy from './catalogueCopyData.json'

// ─────────────────────────────────────────────────────────────────────────────
// One-shot copy refresh of the live catalogue (SEO and language pass).
//
// The catalogue lives in the database and is edited in the admin panel, so new
// copy cannot ship by editing app/data/*.ts. This applies the reviewed texts
// in catalogueCopyData.json to the rows that exist, FIELD BY FIELD:
//
//   vehicles / equipment   name, tagline, description, highlights, slugEn
//   vehicles only          make, model, modelYear, and the listed spec fields
//   equipment categories   name, title, metaTitle, metaDescription, intro, faq
//
// Only the fields present for an item are written. Everything else on the row
// (images, specs, registration numbers, category, slug, sort order, featured)
// stays exactly as the admin left it, and a row the admin deleted is never
// brought back. Runs once per COPY_REV (meta flag); after that the admin panel
// is the source of truth again.
//
// The data file was written against the live catalogue of 2026-11-16. Bump
// COPY_REV only after diffing it against the live API again, because a new
// revision overwrites admin edits to these fields.
//
// rev 1 (2026-11-16): keyword-first names ("Ford Transit kassabíll með lyftu"),
// distinct copy for the two box trucks, British spelling throughout the
// English, English URL segments (slugEn) for every item, highlights for the
// items that had none, meta titles and descriptions inside search-result
// limits, and FAQs for three more categories.
// ─────────────────────────────────────────────────────────────────────────────
const COPY_REV = 1

type ItemCopy = {
  slugEn?: string
  /** Vehicles only: manufacturer, model and model year for structured data */
  make?: string
  model?: string
  modelYear?: number
  /** Vehicles only: spec fields to set (merged into the row's specs) */
  specs?: Partial<Vehicle['specs']>
  name?: LocalizedText
  tagline?: LocalizedText
  description?: LocalizedText
  highlights?: LocalizedText[]
}
type CategoryCopy = Pick<EquipmentCategoryDef, 'name' | 'title' | 'metaTitle' | 'metaDescription' | 'intro' | 'faq'>

const data = copy as {
  vehicles: Record<string, ItemCopy>
  equipment: Record<string, ItemCopy>
  categories: Record<string, CategoryCopy>
}

export function refreshCatalogueCopy(db: Database.Database) {
  const flag = `catalogue:copy:${COPY_REV}`
  if (db.prepare('SELECT value FROM meta WHERE key = ?').get(flag)) return

  const now = new Date().toISOString()
  const counts = { vehicles: 0, equipment: 0, categories: 0 }

  db.transaction(() => {
    // An English segment is only taken when no other row already answers to it.
    const vehicleRows = db.prepare('SELECT id, data FROM vehicles').all() as { id: string, data: string }[]
    const vehicleSlugs = new Map<string, string>()
    for (const r of vehicleRows) {
      const v = JSON.parse(r.data) as Vehicle
      vehicleSlugs.set(v.slug, r.id)
      if (v.slugEn) vehicleSlugs.set(v.slugEn, r.id)
    }
    const updateVehicle = db.prepare('UPDATE vehicles SET data = ?, updated_at = ? WHERE id = ?')
    for (const r of vehicleRows) {
      const patch = data.vehicles[r.id]
      if (!patch) continue
      const { slugEn, specs, ...text } = patch
      const prev = JSON.parse(r.data) as Vehicle
      const next: Vehicle = { ...prev, ...text, specs: { ...prev.specs, ...specs } }
      if (slugEn && (vehicleSlugs.get(slugEn) ?? r.id) === r.id) {
        next.slugEn = slugEn
        vehicleSlugs.set(slugEn, r.id)
      }
      updateVehicle.run(JSON.stringify(next), now, r.id)
      counts.vehicles++
    }

    const categoryRows = db.prepare('SELECT id, data FROM equipment_categories').all() as { id: string, data: string }[]
    const taken = new Map<string, string>()
    for (const r of categoryRows) {
      const c = JSON.parse(r.data) as Partial<EquipmentCategoryDef>
      for (const s of [c.slug?.is, c.slug?.en, ...(c.previousSlugs ?? [])]) if (s) taken.set(s, `category:${r.id}`)
    }
    const equipmentRows = db.prepare('SELECT id, data FROM equipment').all() as { id: string, data: string }[]
    for (const r of equipmentRows) {
      const e = JSON.parse(r.data) as EquipmentItem
      taken.set(equipmentSlug(e), r.id)
      if (e.slugEn) taken.set(e.slugEn, r.id)
    }
    const updateEquipment = db.prepare('UPDATE equipment SET data = ?, updated_at = ? WHERE id = ?')
    for (const r of equipmentRows) {
      const patch = data.equipment[r.id]
      if (!patch) continue
      const { slugEn, make: _make, model: _model, modelYear: _year, specs: _specs, ...text } = patch
      const next = { ...(JSON.parse(r.data) as EquipmentItem), ...text }
      if (slugEn && (taken.get(slugEn) ?? r.id) === r.id) {
        next.slugEn = slugEn
        taken.set(slugEn, r.id)
      }
      updateEquipment.run(JSON.stringify(next), now, r.id)
      counts.equipment++
    }

    const updateCategory = db.prepare('UPDATE equipment_categories SET data = ?, updated_at = ? WHERE id = ?')
    for (const r of categoryRows) {
      const patch = data.categories[r.id]
      if (!patch) continue
      updateCategory.run(JSON.stringify({ ...JSON.parse(r.data), ...patch }), now, r.id)
      counts.categories++
    }

    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run(flag, '1')
  })()

  console.log(`[db] catalogue copy rev ${COPY_REV}: refreshed ${counts.vehicles} vehicles, ${counts.equipment} equipment items, ${counts.categories} categories`)
}
