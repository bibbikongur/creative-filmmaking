export default defineEventHandler(async (event) => {
  const configured = portalConfigured()
  if (!configured) return { configured, authenticated: false }

  const user = await getPortalUser(event)
  if (!user) return { configured, authenticated: false }

  return {
    configured,
    authenticated: true,
    user,
    memberships: membershipsForUser(user.id),
  }
})
