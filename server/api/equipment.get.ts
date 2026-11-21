// Public equipment list — the catalogue page and admin panel read from here so
// admin edits show up immediately. `?view=card` leaves out the descriptions
// (see server/utils/catalogueViews.ts).
export default defineEventHandler(async (event) => {
  const items = await getEquipment()
  return wantsCardView(event) ? items.map(equipmentCard) : items
})
