import { vehicleLandings } from '~~/app/data/vehicleLandings'
import { equipmentSlug, equipmentSlugFor, vehicleSlugFor } from '~~/app/utils/equipmentSlug'

/**
 * The vehicle type pages have a different last segment per language
 * (/vehicles/kassabilar, /en/vehicles/box-trucks). The other language's
 * segment (/en/vehicles/kassabilar, /vehicles/box-trucks) maps to the right
 * page here; server/middleware/01.landing-redirects.ts answers with the 301.
 */
export const LANDING_REDIRECTS = new Map<string, string>(vehicleLandings.flatMap((l) => {
  const is = l.paths.is.split('/').pop()!
  const en = l.paths.en.split('/').pop()!
  return is === en
    ? []
    : [
        [`/vehicles/${en}`, `/vehicles/${is}`],
        [`/en/vehicles/${is}`, `/en/vehicles/${en}`],
      ] as [string, string][]
}))

/**
 * Where a catalogue path ends up once its language segment is right, or
 * undefined when it is already there (or is not a catalogue path at all).
 * Mirrors the 301s in app/pages/equipment/[slug].vue and
 * app/pages/vehicles/[slug].vue, so the canonical-URL middleware can fold a
 * host or trailing-slash redirect and the slug redirect into one hop.
 */
export async function resolveLocalisedPath(path: string): Promise<string | undefined> {
  const landing = LANDING_REDIRECTS.get(path)
  if (landing) return landing

  const match = path.match(/^(\/en)?\/(equipment|vehicles)\/([^/]+)$/)
  if (!match) return undefined
  const prefix = match[1] ?? ''
  const locale = prefix ? 'en' : 'is'
  const param = decodeURIComponent(match[3]!)
  const moved = (section: string, slug: string) => (slug === param ? undefined : `${prefix}/${section}/${slug}`)

  if (match[2] === 'vehicles') {
    const vehicles = await getVehicles()
    const vehicle = vehicles.find(v => v.slug === param) ?? vehicles.find(v => v.slugEn === param)
    return vehicle ? moved('vehicles', vehicleSlugFor(vehicle, locale)) : undefined
  }

  const categories = await getEquipmentCategories(false)
  const category = categories.find(c => c.slug.is === param || c.slug.en === param || c.previousSlugs.includes(param))
  if (category) return moved('equipment', category.slug[locale] || category.slug.en)

  const items = await getEquipment()
  const item = items.find(e => equipmentSlug(e) === param) ?? items.find(e => e.slugEn === param) ?? items.find(e => e.id === param)
  return item ? moved('equipment', equipmentSlugFor(item, locale)) : undefined
}
