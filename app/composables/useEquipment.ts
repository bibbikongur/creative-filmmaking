import type { EquipmentCategory, EquipmentItem } from '~/types'

// Equipment data comes from the server store (editable via /admin/equipment)
// rather than a static import, so published changes appear without a redeploy.
// Await this in setup: `const { all } = await useEquipment()`.
export const useEquipment = async () => {
  const { data } = await useFetch<EquipmentItem[]>('/api/equipment', {
    key: 'equipment',
    default: () => [],
  })

  const all = (): EquipmentItem[] => data.value

  const byCategory = (category: EquipmentCategory): EquipmentItem[] =>
    data.value.filter(e => e.category === category)

  const featured = (): EquipmentItem[] => data.value.filter(e => e.featured)

  return { all, byCategory, featured }
}
