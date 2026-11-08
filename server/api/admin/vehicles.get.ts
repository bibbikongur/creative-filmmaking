// Full fleet list for the admin panel, including registration numbers.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return getVehicles()
})
