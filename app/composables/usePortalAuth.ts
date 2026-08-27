import type { PortalMemberships, PortalUserPublic } from '~/types'

interface PortalSessionResponse {
  configured: boolean
  authenticated: boolean
  user?: PortalUserPublic
  memberships?: PortalMemberships
  allowedTools?: string[]
}

// Client-side view of the portal session. The server is the source of truth —
// every endpoint re-checks the cookie; this just drives the UI.
export const usePortalAuth = () => {
  // null = not yet checked (show spinner instead of flashing the login form)
  const authed = useState<boolean | null>('portal-authed', () => null)
  const configured = useState<boolean>('portal-configured', () => true)
  const user = useState<PortalUserPublic | null>('portal-user', () => null)
  const memberships = useState<PortalMemberships | null>('portal-memberships', () => null)
  // null = unknown (session not yet checked); [] = no tools at all.
  const allowedTools = useState<string[] | null>('portal-allowed-tools', () => null)

  const apply = (res: { user?: PortalUserPublic, memberships?: PortalMemberships, allowedTools?: string[] }) => {
    user.value = res.user ?? null
    memberships.value = res.memberships ?? null
    allowedTools.value = res.allowedTools ?? null
  }

  const check = async () => {
    try {
      const res = await $fetch<PortalSessionResponse>('/api/portal/session', { query: { t: Date.now() } })
      configured.value = res.configured
      authed.value = res.authenticated
      apply(res)
    }
    catch {
      authed.value = false
    }
  }

  const login = async (email: string, password: string) => {
    const res = await $fetch<PortalSessionResponse>('/api/portal/login', {
      method: 'POST',
      body: { email, password },
    })
    authed.value = true
    apply(res)
  }

  const logout = async () => {
    await $fetch('/api/portal/logout', { method: 'POST' })
    authed.value = false
    user.value = null
    memberships.value = null
    allowedTools.value = null
  }

  const isCompanyAdmin = computed(() => (memberships.value?.adminCompanies.length ?? 0) > 0)
  const isDeptAdmin = computed(() => (memberships.value?.deptAdmin.length ?? 0) > 0)
  const canReview = computed(() => isCompanyAdmin.value || isDeptAdmin.value)
  const hasJobs = computed(() => (memberships.value?.jobs.length ?? 0) > 0)
  // Unknown (pre-check) counts as allowed so the nav doesn't flash off for old sessions.
  const canUseTool = (slug: string) => allowedTools.value === null || allowedTools.value.includes(slug)
  const hasAnyTool = computed(() => allowedTools.value === null || allowedTools.value.length > 0)

  return { authed, configured, user, memberships, allowedTools, isCompanyAdmin, isDeptAdmin, canReview, hasJobs, canUseTool, hasAnyTool, check, login, logout }
}
