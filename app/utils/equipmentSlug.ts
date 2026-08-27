import type { EquipmentItem } from '~/types'

// Equipment rows carry no slug column (unlike vehicles), so detail-page URLs
// are derived from the Icelandic name. Deterministic on both server and
// client, and admin-added items get a URL automatically. Renaming an item
// changes its URL; the detail page also accepts the raw id and 301s to the
// current slug, so old links keep working.

const ICELANDIC: Record<string, string> = {
  á: 'a', ð: 'd', é: 'e', í: 'i', ó: 'o', ú: 'u', ý: 'y', þ: 'th', æ: 'ae', ö: 'o',
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áðéíóúýþæö]/g, ch => ICELANDIC[ch]!)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** URL segment for an equipment item; falls back to the id for empty names. */
export function equipmentSlug(item: Pick<EquipmentItem, 'id' | 'name'>): string {
  return slugify(item.name.is || item.name.en) || item.id
}
