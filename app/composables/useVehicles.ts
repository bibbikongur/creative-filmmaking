import type { Vehicle, VehicleCategory } from '~/types'

// Fleet data comes from the server store (editable via /admin) rather than a
// static import, so published changes appear without a redeploy. Await this
// in setup: `const { all } = await useVehicles()`.
export const useVehicles = async () => {
  const { data } = await useFetch<Vehicle[]>('/api/vehicles', {
    key: 'fleet',
    default: () => [],
  })

  const all = (): Vehicle[] => data.value

  const byCategory = (category: VehicleCategory): Vehicle[] =>
    data.value.filter(v => v.category === category)

  const bySlug = (slug: string): Vehicle | undefined =>
    data.value.find(v => v.slug === slug)

  const featured = (): Vehicle[] => data.value.filter(v => v.featured)

  return { all, byCategory, bySlug, featured }
}
