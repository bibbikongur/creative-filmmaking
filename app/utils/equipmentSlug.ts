import type { EquipmentItem } from '~/types'

// Equipment URLs. Rows saved with an explicit `slug` use it, so renaming an
// item in admin can't move its page (and lose its Google index entry). Older
// rows without one fall back to a slug derived from the Icelandic name, which
// is deterministic on server and client. The detail page also accepts the raw
// id and 301s to the current slug, so old links keep working either way.
//
// Category landing pages share the /equipment/<slug> space. The server
// refuses an item slug that equals any category slug (current or former), and
// the page resolves categories before items, so a category can never be
// shadowed by an item.

const ICELANDIC: Record<string, string> = {
  á: 'a', ð: 'd', é: 'e', í: 'i', ó: 'o', ú: 'u', ý: 'y', þ: 'th', æ: 'ae', ö: 'o',
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áðéíóúýþæö]/g, ch => ICELANDIC[ch]!)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Slug an item would get from its name alone (the admin form's auto-fill). */
export function derivedEquipmentSlug(item: Pick<EquipmentItem, 'id' | 'name'>): string {
  return slugify(item.name.is || item.name.en) || item.id
}

/** URL segment for an equipment item. */
export function equipmentSlug(item: Pick<EquipmentItem, 'id' | 'name' | 'slug'>): string {
  return item.slug || derivedEquipmentSlug(item)
}

/**
 * URL segment of a catalogue item in a given language. Items may carry an
 * English segment (`slugEn`) so /en/... addresses read in English
 * ("/en/equipment/traffic-cones-50-cm"); without one both languages share
 * the Icelandic segment, which is how every item worked before.
 */
export function equipmentSlugFor(item: Pick<EquipmentItem, 'id' | 'name' | 'slug' | 'slugEn'>, locale: string): string {
  return (locale === 'en' && item.slugEn) || equipmentSlug(item)
}

export function vehicleSlugFor(vehicle: { slug: string, slugEn?: string }, locale: string): string {
  return (locale === 'en' && vehicle.slugEn) || vehicle.slug
}
