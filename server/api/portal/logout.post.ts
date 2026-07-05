export default defineEventHandler(async (event) => {
  const session = await getPortalSession(event)
  await session.clear()
  return { ok: true }
})
