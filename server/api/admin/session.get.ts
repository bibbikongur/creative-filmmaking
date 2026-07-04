// The admin UI asks this on load to decide between login form and panel.
export default defineEventHandler(async event => ({
  configured: adminConfigured(),
  authenticated: await isAdmin(event),
}))
