// Client-side view of the admin session. The server is the source of truth —
// every mutating endpoint re-checks the cookie; this just drives the UI.
export const useAdminAuth = () => {
  // null = not yet checked (show spinner instead of flashing the login form)
  const authed = useState<boolean | null>('admin-authed', () => null)
  const configured = useState<boolean>('admin-configured', () => true)
  // Two-factor is on: the login form also asks for an authenticator code.
  const twoFactor = useState<boolean>('admin-two-factor', () => false)

  const check = async () => {
    try {
      const res = await $fetch<{ configured: boolean, authenticated: boolean, twoFactor?: boolean }>('/api/admin/session')
      configured.value = res.configured
      twoFactor.value = Boolean(res.twoFactor)
      authed.value = res.authenticated
    }
    catch {
      authed.value = false
    }
  }

  const login = async (password: string, code = '') => {
    await $fetch('/api/admin/login', { method: 'POST', body: { password, code } })
    authed.value = true
  }

  const logout = async () => {
    await $fetch('/api/admin/logout', { method: 'POST' })
    authed.value = false
  }

  return { authed, configured, twoFactor, check, login, logout }
}
