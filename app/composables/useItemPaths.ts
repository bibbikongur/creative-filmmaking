import type { EquipmentItem, Vehicle } from '~/types'

// Localised links to catalogue detail pages. Items can have a different URL
// segment per language (see equipmentSlugFor / vehicleSlugFor), so every link
// to a vehicle or an equipment item goes through here instead of building
// `/vehicles/${slug}` by hand.
export const useItemPaths = () => {
  const { locale } = useI18n()
  const localePath = useLocalePath()

  const vehiclePath = (v: Pick<Vehicle, 'slug' | 'slugEn'>): string =>
    localePath(`/vehicles/${vehicleSlugFor(v, locale.value)}`)

  const equipmentPath = (e: Pick<EquipmentItem, 'id' | 'name' | 'slug' | 'slugEn'>): string =>
    localePath(`/equipment/${equipmentSlugFor(e, locale.value)}`)

  return { vehiclePath, equipmentPath }
}
