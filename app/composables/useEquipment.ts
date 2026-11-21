import type { EquipmentCategory, EquipmentItem } from '~/types'

// Equipment data comes from the server store (editable via /admin/equipment)
// rather than a static import, so published changes appear without a redeploy.
// Await this in setup: `const { all } = await useEquipment()`.
//
// The list is the card view: no descriptions, because it is serialised into
// the HTML of every page. An item's own page loads its description with
// useEquipmentItem().
export const useEquipment = async () => {
  const { data } = await useFetch<EquipmentItem[]>('/api/equipment', {
    key: 'equipment',
    query: { view: 'card' },
    default: () => [],
  })

  const all = (): EquipmentItem[] => data.value

  const byCategory = (category: EquipmentCategory): EquipmentItem[] =>
    data.value.filter(e => e.category === category)

  const featured = (): EquipmentItem[] => data.value.filter(e => e.featured)

  return { all, byCategory, featured }
}

/** One item with its full copy (the description), for its own page. */
export const useEquipmentItem = async (id: string) => {
  const { data } = await useFetch<EquipmentItem>(`/api/equipment/${id}`, { key: `equipment:${id}` })
  return data
}
