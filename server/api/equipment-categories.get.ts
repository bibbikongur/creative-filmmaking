// Public list of active equipment categories (names, slugs, landing copy).
// The catalogue, cards, footer and category landing pages read from here.
export default defineEventHandler(() => getEquipmentCategories(false))
