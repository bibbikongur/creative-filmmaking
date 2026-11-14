// The admin UI asks this on load to decide between login form and panel.
// `twoFactor` tells the login form to ask for an authenticator code up front,
// so the login endpoint never has to reveal "password right, now the code".
export default defineEventHandler(async event => ({
  configured: adminConfigured(),
  authenticated: await isAdmin(event),
  twoFactor: adminConfigured() && adminTwoFactorEnabled(),
}))
