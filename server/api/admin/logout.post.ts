export default defineEventHandler(async (event) => {
  if (adminConfigured()) {
    const session = await getAdminSession(event)
    await session.clear()
  }
  return { ok: true }
})
