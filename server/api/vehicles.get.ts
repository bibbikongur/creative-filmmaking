// Public fleet list — the whole site (catalogue, detail pages, offer-form
// dropdown) reads vehicles from here so admin edits show up immediately.
// Registration numbers are admin-only (see /api/admin/vehicles).
// `?view=card` leaves out the descriptions (see server/utils/catalogueViews.ts).
export default defineEventHandler(async (event) => {
  const vehicles = (await getVehicles()).map(publicVehicle)
  return wantsCardView(event) ? vehicles.map(vehicleCard) : vehicles
})
