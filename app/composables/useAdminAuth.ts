// Client-side view of the admin session. The server is the source of truth —
// every mutating endpoint re-checks the cookie; this just drives the UI.
export const useAdminAuth = () => {
  // null = not yet checked (show spinner instead of flashing the login form)
  const authed = useState<boolean | null>('admin-authed', () => null)
  const configured = useState<boolean>('admin-configured', () => true)

  const check = async () => {
    try {
      const res = await $fetch<{ configured: boolean, authenticated: boolean }>('/api/admin/session')
      configured.value = res.configured
      authed.value = res.authenticated
    }
    catch {
      authed.value = false
    }
  }

  const login = async (password: string) => {
    await $fetch('/api/admin/login', { method: 'POST', body: { password } })
    authed.value = true
  }

  const logout = async () => {
    await $fetch('/api/admin/logout', { method: 'POST' })
    authed.value = false
  }

  return { authed, configured, check, login, logout }
}
