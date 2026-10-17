import { equipmentSlug } from '~~/app/utils/equipmentSlug'

import type { EquipmentCategoryDef, EquipmentItem, Vehicle } from '~~/app/types'

// Feed vehicle + equipment detail URLs (and the equipment category landing
// pages) to @nuxtjs/seo's sitemap module. The i18n integration expands
// vehicle/item entries into their per-locale variant with hreflang links.
// Category pages have a different slug per language, so they are listed per
// locale with explicit alternatives instead. Reads the database directly so
// admin changes appear immediately and updated_at becomes lastmod.
export default defineSitemapEventHandler(async () => {
  const db = getDb()
  const vehicleRows = db.prepare('SELECT data, updated_at FROM vehicles ORDER BY sort')
    .all() as { data: string, updated_at: string | null }[]
  const equipmentRows = db.prepare('SELECT data, updated_at FROM equipment ORDER BY sort')
    .all() as { data: string, updated_at: string | null }[]
  const categoryRows = db.prepare("SELECT id, data, updated_at FROM equipment_categories WHERE status = 'active' ORDER BY sort")
    .all() as { id: string, data: string, updated_at: string | null }[]

  const vehicles = vehicleRows.map((row) => {
    const v = JSON.parse(row.data) as Vehicle
    return {
      loc: `/vehicles/${v.slug}`,
      _i18nTransform: true,
      ...(row.updated_at ? { lastmod: row.updated_at } : {}),
      // Google Images discovery — the module resolves relative paths against site.url.
      images: v.images.map(src => ({ loc: src })),
    }
  })
  const items = equipmentRows.map(row => JSON.parse(row.data) as EquipmentItem)
  const equipment = equipmentRows.map((row, i) => {
    const e = items[i]!
    return {
      loc: `/equipment/${equipmentSlug(e)}`,
      _i18nTransform: true,
      ...(row.updated_at ? { lastmod: row.updated_at } : {}),
      images: e.images.map(src => ({ loc: src })),
    }
  })

  // Only categories that have items: an empty category page is noindexed.
  const categories = categoryRows.flatMap((row) => {
    const c = { id: row.id, ...JSON.parse(row.data) } as Pick<EquipmentCategoryDef, 'id' | 'slug'>
    if (!items.some(e => e.category === c.id)) return []
    const isHref = `/equipment/${c.slug.is}`
    const enHref = `/en/equipment/${c.slug.en}`
    const alternatives = [
      { hreflang: 'is', href: isHref },
      { hreflang: 'en', href: enHref },
      { hreflang: 'x-default', href: isHref },
    ]
    const lastmod = row.updated_at ? { lastmod: row.updated_at } : {}
    return [
      { loc: isHref, alternatives, ...lastmod },
      { loc: enHref, alternatives, ...lastmod },
    ]
  })

  return [...vehicles, ...equipment, ...categories]
})
