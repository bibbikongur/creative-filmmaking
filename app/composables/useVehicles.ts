import { vehicles } from '~/data/vehicles'
import type { Vehicle, VehicleCategory } from '~/types'

export const useVehicles = () => {
  const all = (): Vehicle[] => vehicles

  const byCategory = (category: VehicleCategory): Vehicle[] =>
    vehicles.filter(v => v.category === category)

  const bySlug = (slug: string): Vehicle | undefined =>
    vehicles.find(v => v.slug === slug)

  const featured = (): Vehicle[] => vehicles.filter(v => v.featured)

  return { all, byCategory, bySlug, featured }
}
