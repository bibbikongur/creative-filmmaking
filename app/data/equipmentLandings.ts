import type { EquipmentCategory, LocaleCode } from '~/types'

/**
 * Keyword landing pages for equipment, one per data category. Same mechanism
 * as app/data/vehicleLandings.ts: a static page file per landing under
 * app/pages/equipment/ (Icelandic path) with the English path declared via
 * defineI18nRoute, rendering EquipmentLandingPage. Copy lives under
 * `landings.equipment.<category>` in the locale files.
 */
export interface EquipmentLanding {
  category: EquipmentCategory
  routeName: string
  paths: Record<LocaleCode, string>
  key: string
}

export const equipmentLandings: EquipmentLanding[] = [
  {
    category: 'heating',
    routeName: 'equipment-hitablasarar',
    paths: { is: '/equipment/hitablasarar', en: '/equipment/heaters' },
    key: 'landings.equipment.heating',
  },
  {
    category: 'power',
    routeName: 'equipment-rafstodvar-og-rafmagn',
    paths: { is: '/equipment/rafstodvar-og-rafmagn', en: '/equipment/power-and-light' },
    key: 'landings.equipment.power',
  },
  {
    category: 'shelter',
    routeName: 'equipment-tjold-og-skyli',
    paths: { is: '/equipment/tjold-og-skyli', en: '/equipment/shelter-and-tents' },
    key: 'landings.equipment.shelter',
  },
  {
    category: 'safety',
    routeName: 'equipment-umferdaroryggi',
    paths: { is: '/equipment/umferdaroryggi', en: '/equipment/safety-and-traffic' },
    key: 'landings.equipment.safety',
  },
  {
    category: 'furniture',
    routeName: 'equipment-husgogn',
    paths: { is: '/equipment/husgogn', en: '/equipment/furniture' },
    key: 'landings.equipment.furniture',
  },
  {
    category: 'cleaning',
    routeName: 'equipment-thrif',
    paths: { is: '/equipment/thrif', en: '/equipment/cleaning' },
    key: 'landings.equipment.cleaning',
  },
]

export const equipmentLandingFor = (category: EquipmentCategory): EquipmentLanding =>
  equipmentLandings.find(l => l.category === category)!

/** Last path segments in every locale; an equipment slug may never be one of these. */
export const RESERVED_EQUIPMENT_SLUGS: readonly string[] = [
  ...new Set(equipmentLandings.flatMap(l => Object.values(l.paths).map(p => p.split('/').pop()!))),
]
