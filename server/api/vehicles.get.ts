// Public fleet list — the whole site (catalogue, detail pages, offer-form
// dropdown) reads vehicles from here so admin edits show up immediately.
export default defineEventHandler(() => getVehicles())
