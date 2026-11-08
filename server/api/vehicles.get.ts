// Public fleet list — the whole site (catalogue, detail pages, offer-form
// dropdown) reads vehicles from here so admin edits show up immediately.
// Registration numbers are admin-only (see /api/admin/vehicles).
export default defineEventHandler(async () => (await getVehicles()).map(publicVehicle))
