// Two-factor status for /admin/security.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return adminTwoFactorStatus()
})
