// Public list of active equipment categories (names, slugs, landing copy).
// The catalogue, cards, footer and category landing pages read from here.
// `?view=card` leaves out the landing copy (see server/utils/catalogueViews.ts).
export default defineEventHandler(async (event) => {
  const categories = await getEquipmentCategories(false)
  return wantsCardView(event) ? categories.map(equipmentCategoryCard) : categories
})
