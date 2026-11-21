import type { EquipmentCategoryDef, EquipmentCategorySummary, LocaleCode } from '~/types'

// Equipment categories come from the server store (editable in
// /admin/equipment/categories), so renames and new categories appear without
// a redeploy. Await this in setup: `const { all, label, path } = await useEquipmentCategories()`.
//
// The list is the card view: names and slugs, without the landing-page copy,
// because it is serialised into the HTML of every page. A category's own page
// loads its copy with useEquipmentCategory().
export const useEquipmentCategories = async () => {
  const { locale } = useI18n()
  const localePath = useLocalePath()

  const { data } = await useFetch<EquipmentCategorySummary[]>('/api/equipment-categories', {
    key: 'equipment-categories',
    query: { view: 'card' },
    default: () => [],
  })

  const all = (): EquipmentCategorySummary[] => data.value

  const byId = (id: string): EquipmentCategorySummary | undefined => data.value.find(c => c.id === id)

  /** Current-locale text with the usual English fallback. */
  const text = (t: { en: string, is: string } | undefined): string =>
    t ? (t[locale.value as LocaleCode] || t.en) : ''

  /** Short category name in the current locale (empty when unknown). */
  const label = (id: string): string => text(byId(id)?.name)

  /** Localised link to a category's landing page. */
  const path = (c: Pick<EquipmentCategorySummary, 'slug'>): string =>
    localePath(`/equipment/${c.slug[locale.value as LocaleCode] || c.slug.en}`)

  return { all, byId, label, path, text }
}

/** One category with its landing-page copy (title, intro, FAQ, meta), for its own page. */
export const useEquipmentCategory = async (id: string) => {
  const { data } = await useFetch<EquipmentCategoryDef>(`/api/equipment-categories/${id}`, { key: `equipment-category:${id}` })
  return data
}
