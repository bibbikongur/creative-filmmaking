import { equipmentSlug } from '~~/app/utils/equipmentSlug'

import type { EquipmentItem, Vehicle } from '~~/app/types'

// Feed vehicle + equipment detail URLs to @nuxtjs/seo's sitemap module. The
// i18n integration expands each into its per-locale variant with hreflang
// links. Reads the database directly so admin-added items appear too and
// updated_at (stamped on admin saves and seed upserts) becomes lastmod.
export default defineSitemapEventHandler(async () => {
  const db = getDb()
  const vehicleRows = db.prepare('SELECT data, updated_at FROM vehicles ORDER BY sort')
    .all() as { data: string, updated_at: string | null }[]
  const equipmentRows = db.prepare('SELECT data, updated_at FROM equipment ORDER BY sort')
    .all() as { data: string, updated_at: string | null }[]

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
  const equipment = equipmentRows.map((row) => {
    const e = JSON.parse(row.data) as EquipmentItem
    return {
      loc: `/equipment/${equipmentSlug(e)}`,
      _i18nTransform: true,
      ...(row.updated_at ? { lastmod: row.updated_at } : {}),
      images: e.images.map(src => ({ loc: src })),
    }
  })
  return [...vehicles, ...equipment]
})
