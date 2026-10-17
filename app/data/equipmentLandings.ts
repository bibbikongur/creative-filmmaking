import type { LocaleCode } from '~/types'

/**
 * SEED ONLY. The six original equipment categories and the URL of each one's
 * keyword landing page. On first boot the server copies these (plus the
 * matching copy in the locale files under `equipmentCategories.<id>` and
 * `landings.equipment.<key>`) into the `equipment_categories` table; after
 * that the database is the source of truth and categories are managed in
 * /admin/equipment/categories.
 *
 * Landing pages are served by app/pages/equipment/[slug].vue, which checks
 * the slug against the categories before treating it as an item.
 */
export interface EquipmentLandingSeed {
  /** Category id; stays stable across renames */
  id: string
  /** Path per locale (without the /en prefix) */
  paths: Record<LocaleCode, string>
  /** i18n key prefix of the landing copy, e.g. landings.equipment.heating */
  key: string
}

export const equipmentLandings: EquipmentLandingSeed[] = [
  { id: 'heating', paths: { is: '/equipment/hitablasarar', en: '/equipment/heaters' }, key: 'landings.equipment.heating' },
  { id: 'power', paths: { is: '/equipment/rafstodvar-og-rafmagn', en: '/equipment/power-and-light' }, key: 'landings.equipment.power' },
  { id: 'shelter', paths: { is: '/equipment/tjold-og-skyli', en: '/equipment/shelter-and-tents' }, key: 'landings.equipment.shelter' },
  { id: 'safety', paths: { is: '/equipment/umferdaroryggi', en: '/equipment/safety-and-traffic' }, key: 'landings.equipment.safety' },
  { id: 'furniture', paths: { is: '/equipment/husgogn', en: '/equipment/furniture' }, key: 'landings.equipment.furniture' },
  { id: 'cleaning', paths: { is: '/equipment/thrif', en: '/equipment/cleaning' }, key: 'landings.equipment.cleaning' },
]

/** Last path segment per locale of a seed landing. */
export const seedSlugOf = (l: EquipmentLandingSeed, code: LocaleCode): string => l.paths[code].split('/').pop()!
