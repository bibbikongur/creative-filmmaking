import type { EquipmentCategoryDef, LocaleCode } from '~/types'

// Equipment categories come from the server store (editable in
// /admin/equipment/categories), so renames and new categories appear without
// a redeploy. Await this in setup: `const { all, label, path } = await useEquipmentCategories()`.
export const useEquipmentCategories = async () => {
  const { locale } = useI18n()
  const localePath = useLocalePath()

  const { data } = await useFetch<EquipmentCategoryDef[]>('/api/equipment-categories', {
    key: 'equipment-categories',
    default: () => [],
  })

  const all = (): EquipmentCategoryDef[] => data.value

  const byId = (id: string): EquipmentCategoryDef | undefined => data.value.find(c => c.id === id)

  /** Current-locale text with the usual English fallback. */
  const text = (t: { en: string, is: string } | undefined): string =>
    t ? (t[locale.value as LocaleCode] || t.en) : ''

  /** Short category name in the current locale (empty when unknown). */
  const label = (id: string): string => text(byId(id)?.name)

  /** Localised link to a category's landing page. */
  const path = (c: EquipmentCategoryDef): string =>
    localePath(`/equipment/${c.slug[locale.value as LocaleCode] || c.slug.en}`)

  return { all, byId, label, path, text }
}
