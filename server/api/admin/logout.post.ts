export default defineEventHandler(async (event) => {
  // Drop the cookie directly: opening a session just to clear it would seal
  // and send a fresh one first.
  deleteCookie(event, 'cf-admin', { path: '/' })
  return { ok: true }
})
