export default defineEventHandler(async (event) => {
  deleteCookie(event, 'cf-portal', { path: '/' })
  return { ok: true }
})
