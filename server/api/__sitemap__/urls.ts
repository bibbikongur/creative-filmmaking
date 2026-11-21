import { equipmentSlug, equipmentSlugFor, vehicleSlugFor } from '~~/app/utils/equipmentSlug'

import type { EquipmentCategoryDef, EquipmentItem, Vehicle } from '~~/app/types'

// Feed vehicle + equipment detail URLs (and the equipment category landing
// pages) to @nuxtjs/seo's sitemap module. Any of them can have a different
// URL segment per language, so every page is listed once per locale with
// explicit hreflang alternatives. Reads the database directly so admin
// changes appear immediately and updated_at becomes lastmod.

/** One sitemap entry per locale for a page with (possibly) different segments. */
const perLocale = (isHref: string, enHref: string, extra: Record<string, unknown>) => {
  const alternatives = [
    // The locales' language codes from nuxt.config, as the sitemap module
    // writes them for the static pages.
    { hreflang: 'is-IS', href: isHref },
    { hreflang: 'en-GB', href: enHref },
    // x-default: the English page (see server/plugins/sitemap-lastmod.ts).
    { hreflang: 'x-default', href: enHref },
  ]
  return [
    { loc: isHref, alternatives, ...extra },
    { loc: enHref, alternatives, ...extra },
  ]
}

export default defineSitemapEventHandler(async () => {
  const db = getDb()
  const vehicleRows = db.prepare('SELECT data, updated_at FROM vehicles ORDER BY sort')
    .all() as { data: string, updated_at: string | null }[]
  const equipmentRows = db.prepare('SELECT data, updated_at FROM equipment ORDER BY sort')
    .all() as { data: string, updated_at: string | null }[]
  const categoryRows = db.prepare("SELECT id, data, updated_at FROM equipment_categories WHERE status = 'active' ORDER BY sort")
    .all() as { id: string, data: string, updated_at: string | null }[]

  const vehicles = vehicleRows.flatMap((row) => {
    const v = JSON.parse(row.data) as Vehicle
    return perLocale(`/vehicles/${v.slug}`, `/en/vehicles/${vehicleSlugFor(v, 'en')}`, {
      ...(row.updated_at ? { lastmod: row.updated_at } : {}),
      // Google Images discovery — the module resolves relative paths against site.url.
      images: v.images.map(src => ({ loc: src })),
    })
  })
  const items = equipmentRows.map(row => JSON.parse(row.data) as EquipmentItem)
  const equipment = equipmentRows.flatMap((row, i) => {
    const e = items[i]!
    return perLocale(`/equipment/${equipmentSlug(e)}`, `/en/equipment/${equipmentSlugFor(e, 'en')}`, {
      ...(row.updated_at ? { lastmod: row.updated_at } : {}),
      images: e.images.map(src => ({ loc: src })),
    })
  })

  // Only categories that have items: an empty category page is noindexed.
  const categories = categoryRows.flatMap((row) => {
    const c = { id: row.id, ...JSON.parse(row.data) } as Pick<EquipmentCategoryDef, 'id' | 'slug'>
    if (!items.some(e => e.category === c.id)) return []
    return perLocale(`/equipment/${c.slug.is}`, `/en/equipment/${c.slug.en}`, row.updated_at ? { lastmod: row.updated_at } : {})
  })

  return [...vehicles, ...equipment, ...categories]
})
