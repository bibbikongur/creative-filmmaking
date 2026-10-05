import type { LocaleCode, VehicleCategory, VehicleKind } from '~/types'

/**
 * Keyword landing pages for the fleet: one crawlable URL per thing people
 * search for ("kassabíll til leigu", "kerra til leigu"), instead of the old
 * ?category= filter that no search engine could rank.
 *
 * Each landing is a tiny static page file under app/pages/vehicles/ (the
 * Icelandic path) with its English path declared via defineI18nRoute, and
 * renders VehicleLandingPage. Static routes always win over the
 * /vehicles/[slug] vehicle page, so the only collision rule needed is that no
 * vehicle may be given one of these slugs (enforced in vehicleStore).
 *
 * Copy lives in the locale files under `landings.vehicles.<key>`.
 */
export interface VehicleLanding {
  id: string
  /** Vehicles with this kind appear on the page. */
  kind: VehicleKind
  /** Closest data category; used for the "more in this category" fallbacks. */
  category: VehicleCategory
  /** Nuxt route name of the page file; use localePath({ name }) to link. */
  routeName: string
  /** Path per locale (without the /en prefix). */
  paths: Record<LocaleCode, string>
  /** i18n key prefix, e.g. landings.vehicles.boxTrucks */
  key: string
}

export const vehicleLandings: VehicleLanding[] = [
  {
    id: 'box-trucks',
    kind: 'box-truck',
    category: 'equipment-cars',
    routeName: 'vehicles-kassabilar',
    paths: { is: '/vehicles/kassabilar', en: '/vehicles/box-trucks' },
    key: 'landings.vehicles.boxTrucks',
  },
  {
    id: 'cargo-vans',
    kind: 'cargo-van',
    category: 'equipment-cars',
    routeName: 'vehicles-sendibilar',
    paths: { is: '/vehicles/sendibilar', en: '/vehicles/cargo-vans' },
    key: 'landings.vehicles.cargoVans',
  },
  {
    id: 'caravans',
    kind: 'caravan',
    category: 'trailers',
    routeName: 'vehicles-hjolhysi',
    paths: { is: '/vehicles/hjolhysi', en: '/vehicles/caravans' },
    key: 'landings.vehicles.caravans',
  },
  {
    id: 'trailers',
    kind: 'trailer',
    category: 'trailers',
    routeName: 'vehicles-kerrur',
    paths: { is: '/vehicles/kerrur', en: '/vehicles/trailers' },
    key: 'landings.vehicles.trailers',
  },
  {
    id: 'atv',
    kind: 'atv',
    category: 'support-vehicles',
    routeName: 'vehicles-sexhjol',
    paths: { is: '/vehicles/sexhjol', en: '/vehicles/atv' },
    key: 'landings.vehicles.atv',
  },
]

export const vehicleKinds: VehicleKind[] = ['box-truck', 'cargo-van', 'caravan', 'trailer', 'atv', 'pickup']

export const landingForKind = (kind?: VehicleKind): VehicleLanding | undefined =>
  kind ? vehicleLandings.find(l => l.kind === kind) : undefined

export const vehicleLandingById = (id: string): VehicleLanding | undefined =>
  vehicleLandings.find(l => l.id === id)

/** Where the retired /vehicles?category=<x> filter URLs 301 to. */
export const landingForCategoryQuery: Record<VehicleCategory, VehicleLanding> = {
  'equipment-cars': vehicleLandings[0]!,
  'trailers': vehicleLandings[3]!,
  'support-vehicles': vehicleLandings[4]!,
  'campers': vehicleLandings[2]!,
}

/** Last path segments in every locale; a vehicle slug may never be one of these. */
export const RESERVED_VEHICLE_SLUGS: readonly string[] = [
  ...new Set(vehicleLandings.flatMap(l => Object.values(l.paths).map(p => p.split('/').pop()!))),
]
