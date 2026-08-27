// ─────────────────────────────────────────────────────────────────────────────
// Per-user access to the portal helper tools ("Hjálpartól"). A company admin
// decides which tools each crew member may use on /portal/access.
//
// Storage: portal_users.tool_access — NULL means every tool (the default for
// new and existing accounts), otherwise a JSON array of allowed slugs.
// Company admins of an active company always get every tool, both so they can
// manage the feature and so nobody can lock themselves out.
// ─────────────────────────────────────────────────────────────────────────────

// Must stay in sync with the client registry in app/composables/usePortalTools.ts
// (tests/toolAccess.test.ts asserts this).
export const PORTAL_TOOL_SLUGS = [
  'pdf-merge',
  'img-to-pdf',
  'location-map',
  'pdf-editor',
  'purchase-orders',
  'location-photos',
  'heic-convert',
  'exif-map',
  'call-sheet',
  'recce-plan',
] as const

export type PortalToolSlug = (typeof PORTAL_TOOL_SLUGS)[number]

/**
 * Validate a client-supplied allow-list: must be an array of known slugs.
 * Returns a deduped list in canonical registry order. Throws 400 otherwise.
 */
export function sanitizeToolSlugs(input: unknown): PortalToolSlug[] {
  if (!Array.isArray(input) || input.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'tools must be an array of tool slugs' })
  }
  const wanted = new Set<string>()
  for (const slug of input) {
    if (typeof slug !== 'string' || !(PORTAL_TOOL_SLUGS as readonly string[]).includes(slug)) {
      throw createError({ statusCode: 400, statusMessage: `Unknown tool: ${String(slug).slice(0, 40)}` })
    }
    wanted.add(slug)
  }
  return PORTAL_TOOL_SLUGS.filter(s => wanted.has(s))
}

/** Raw stored allow-list; null = every tool. Unknown slugs are dropped on read. */
export function getToolAccess(userId: string): PortalToolSlug[] | null {
  const row = getDb().prepare('SELECT tool_access FROM portal_users WHERE id = ?')
    .get(userId) as { tool_access: string | null } | undefined
  if (!row || row.tool_access === null) return null
  try {
    const parsed = JSON.parse(row.tool_access)
    if (!Array.isArray(parsed)) return null
    return PORTAL_TOOL_SLUGS.filter(s => parsed.includes(s))
  }
  catch {
    return null
  }
}

/** Overwrite the allow-list; null restores the default (every tool). */
export function setToolAccess(userId: string, slugs: PortalToolSlug[] | null) {
  getDb().prepare('UPDATE portal_users SET tool_access = ? WHERE id = ?')
    .run(slugs === null ? null : JSON.stringify(slugs), userId)
}

/** Does the user administer any active company? Admins always get every tool. */
export function isAnyCompanyAdmin(userId: string): boolean {
  return Boolean(getDb().prepare(`
    SELECT 1 FROM company_admins ca
    JOIN companies c ON c.id = ca.company_id AND c.status = 'active'
    WHERE ca.user_id = ?
  `).get(userId))
}

/** The tools this user may actually use — what the nav, grid and API enforce. */
export function allowedToolsFor(userId: string): PortalToolSlug[] {
  if (isAnyCompanyAdmin(userId)) return [...PORTAL_TOOL_SLUGS]
  return getToolAccess(userId) ?? [...PORTAL_TOOL_SLUGS]
}

/**
 * May `adminId` manage `targetId`'s tool access? True when the target is an
 * active member of a job in one of the admin's active companies.
 */
export function adminManagesUser(adminCompanyIds: string[], targetId: string): boolean {
  if (!adminCompanyIds.length) return false
  const placeholders = adminCompanyIds.map(() => '?').join(', ')
  return Boolean(getDb().prepare(`
    SELECT 1 FROM job_members m
    JOIN jobs j ON j.id = m.job_id
    WHERE m.user_id = ? AND m.status = 'active' AND j.company_id IN (${placeholders})
  `).get(targetId, ...adminCompanyIds))
}

export interface ToolAccessUser {
  id: string
  email: string
  name?: string
  status: string
  /** Job names inside the admin's companies, for context in the list. */
  jobs: string[]
  /** Company admins are shown but locked to full access. */
  isAdmin: boolean
  /** null = every tool (default). */
  tools: PortalToolSlug[] | null
}

/** Every active job member across the admin's companies, with their access. */
export function listToolAccessUsers(adminCompanyIds: string[]): ToolAccessUser[] {
  if (!adminCompanyIds.length) return []
  const placeholders = adminCompanyIds.map(() => '?').join(', ')
  const rows = getDb().prepare(`
    SELECT u.id, u.email, u.name, u.status, u.tool_access,
           GROUP_CONCAT(j.name, char(31)) AS job_names,
           EXISTS (
             SELECT 1 FROM company_admins ca
             JOIN companies c ON c.id = ca.company_id AND c.status = 'active'
             WHERE ca.user_id = u.id
           ) AS is_admin
    FROM portal_users u
    JOIN job_members m ON m.user_id = u.id AND m.status = 'active'
    JOIN jobs j ON j.id = m.job_id AND j.company_id IN (${placeholders})
    GROUP BY u.id
    ORDER BY COALESCE(u.name, u.email) COLLATE NOCASE
  `).all(...adminCompanyIds) as Record<string, unknown>[]

  return rows.map((r) => {
    let tools: PortalToolSlug[] | null = null
    if (typeof r.tool_access === 'string') {
      try {
        const parsed = JSON.parse(r.tool_access)
        tools = Array.isArray(parsed) ? PORTAL_TOOL_SLUGS.filter(s => parsed.includes(s)) : null
      }
      catch { /* treat unreadable as default */ }
    }
    return {
      id: r.id as string,
      email: r.email as string,
      name: (r.name as string | null) ?? undefined,
      status: r.status as string,
      jobs: typeof r.job_names === 'string' ? [...new Set(r.job_names.split('\x1F'))] : [],
      isAdmin: Boolean(r.is_admin),
      tools,
    }
  })
}
