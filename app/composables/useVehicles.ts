import type { Vehicle, VehicleCategory, VehicleKind, VehicleSummary } from '~/types'

// Fleet data comes from the server store (editable via /admin) rather than a
// static import, so published changes appear without a redeploy. Await this
// in setup: `const { all } = await useVehicles()`.
//
// The list is the card view: no descriptions, because it is serialised into
// the HTML of every page. A vehicle's own page loads its description with
// useVehicle().
export const useVehicles = async () => {
  const { data } = await useFetch<VehicleSummary[]>('/api/vehicles', {
    key: 'fleet',
    query: { view: 'card' },
    default: () => [],
  })

  const all = (): VehicleSummary[] => data.value

  const byCategory = (category: VehicleCategory): VehicleSummary[] =>
    data.value.filter(v => v.category === category)

  const byKind = (kind: VehicleKind): VehicleSummary[] =>
    data.value.filter(v => v.kind === kind)

  const bySlug = (slug: string): VehicleSummary | undefined =>
    data.value.find(v => v.slug === slug)

  const featured = (): VehicleSummary[] => data.value.filter(v => v.featured)

  return { all, byCategory, byKind, bySlug, featured }
}

/** One vehicle with its full copy (the description), for its own page. */
export const useVehicle = async (id: string) => {
  const { data } = await useFetch<Vehicle>(`/api/vehicles/${id}`, { key: `vehicle:${id}` })
  return data
}
