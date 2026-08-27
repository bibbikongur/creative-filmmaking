import type { ReccePlanContact, ReccePlanData, ReccePlanDoc, ReccePlanStop, ReccePlanSummary } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Recce plans (portal tool "recce áætlun"): per-user saved documents. The whole
// plan — stops with their downscaled photos (data URLs), contacts and timing —
// is one JSON blob in the recce_plans table. Every access is scoped by
// user_id, so one user can never read or write another's plans.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_NAME = 120
const MAX_STOPS = 60
const MAX_CONTACTS = 30
const MAX_PHOTOS_PER_STOP = 2
/** Photos are downscaled client-side (~700px JPEG); this is a hard backstop. */
const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024
/** Whole-document JSON cap. */
const MAX_PAYLOAD_BYTES = 20 * 1024 * 1024

const fail = (message: string): never => {
  throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors: [message] } })
}

const str = (value: unknown, maxLen: number): string =>
  typeof value === 'string' ? value.slice(0, maxLen) : ''

/** Clamped non-negative whole minutes. */
const minutes = (value: unknown, max = 24 * 60): number => {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n))) : 0
}

/** "HH:MM" or empty. */
const hm = (value: unknown): string =>
  typeof value === 'string' && /^\d{1,2}:\d{2}$/.test(value) ? value : ''

/** Validate a client-supplied name. Pure (no DB) so it's unit-testable. */
export function validatePlanName(input: unknown): string {
  const name = typeof input === 'string' ? input.trim().slice(0, MAX_NAME) : ''
  if (!name) fail('Name is required.')
  return name
}

/** Validate the client-supplied plan payload. Pure (no DB) so it's unit-testable. */
export function validatePlanData(input: unknown): ReccePlanData {
  const d = (input ?? {}) as Record<string, unknown>

  const stopsRaw = d.stops ?? []
  if (!Array.isArray(stopsRaw) || stopsRaw.length > MAX_STOPS) fail(`Stops must be a list of at most ${MAX_STOPS}.`)
  const stops = (stopsRaw as unknown[]).map((raw, i): ReccePlanStop => {
    const s = (raw ?? {}) as Record<string, unknown>
    const where = `Stop ${i + 1}`
    const photosRaw = s.photos ?? []
    if (!Array.isArray(photosRaw) || photosRaw.length > MAX_PHOTOS_PER_STOP) {
      fail(`${where}: at most ${MAX_PHOTOS_PER_STOP} photos.`)
    }
    const photos = (photosRaw as unknown[]).map((p) => {
      if (typeof p !== 'string' || !p.startsWith('data:image/jpeg;base64,')) fail(`${where}: bad photo data.`)
      if ((p as string).length > MAX_PHOTO_BYTES) fail(`${where}: a photo is too large.`)
      return p as string
    })
    return {
      name: str(s.name, 160).trim(),
      address: str(s.address, 200).trim(),
      notes: str(s.notes, 1000).trim(),
      link: str(s.link, 500).trim(),
      coords: str(s.coords, 60).trim(),
      ...(s.coordsAuto ? { coordsAuto: true } : {}),
      photos,
      durationMin: minutes(s.durationMin),
      travelMin: minutes(s.travelMin),
    }
  })

  const contactsRaw = d.contacts ?? []
  if (!Array.isArray(contactsRaw) || contactsRaw.length > MAX_CONTACTS) {
    fail(`Contacts must be a list of at most ${MAX_CONTACTS}.`)
  }
  const contacts = (contactsRaw as unknown[]).map((raw): ReccePlanContact => {
    const c = (raw ?? {}) as Record<string, unknown>
    return {
      name: str(c.name, 120).trim(),
      role: str(c.role, 120).trim(),
      phone: str(c.phone, 40).trim(),
    }
  })

  const data: ReccePlanData = {
    subtitle: str(d.subtitle, 60).trim(),
    date: typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : '',
    startTime: hm(d.startTime),
    note: str(d.note, 1000).trim(),
    stops,
    contacts,
  }
  if (JSON.stringify(data).length > MAX_PAYLOAD_BYTES) fail('The plan is too large to save.')
  return data
}

/** A fresh plan: sensible defaults plus one empty stop. */
export const emptyPlanData = (): ReccePlanData => ({
  subtitle: 'Tech recce',
  date: '',
  startTime: '08:00',
  note: '',
  stops: [{ name: '', address: '', notes: '', link: '', coords: '', photos: [], durationMin: 60, travelMin: 30 }],
  contacts: [],
})

function rowToDoc(r: Record<string, unknown>): ReccePlanDoc {
  return {
    id: r.id as string,
    name: r.name as string,
    jobId: (r.job_id as string | null) ?? undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    data: JSON.parse((r.data as string) || '{}') as ReccePlanData,
  }
}

/** Pass a jobId to list only that job's plans ("Hjálpargögn" on the job page). */
export function listReccePlans(userId: string, jobId?: string): ReccePlanSummary[] {
  const rows = (jobId
    ? getDb().prepare(`
        SELECT id, name, job_id, updated_at, json_array_length(data, '$.stops') AS stop_count
        FROM recce_plans WHERE user_id = ? AND job_id = ? ORDER BY updated_at DESC
      `).all(userId, jobId)
    : getDb().prepare(`
        SELECT id, name, job_id, updated_at, json_array_length(data, '$.stops') AS stop_count
        FROM recce_plans WHERE user_id = ? ORDER BY updated_at DESC
      `).all(userId)) as Record<string, unknown>[]
  return rows.map(r => ({
    id: r.id as string,
    name: r.name as string,
    jobId: (r.job_id as string | null) ?? undefined,
    updatedAt: r.updated_at as string,
    stopCount: (r.stop_count as number) ?? 0,
  }))
}

export function getReccePlan(userId: string, id: string): ReccePlanDoc | null {
  const row = getDb().prepare('SELECT * FROM recce_plans WHERE id = ? AND user_id = ?')
    .get(id, userId) as Record<string, unknown> | undefined
  return row ? rowToDoc(row) : null
}

export function createReccePlan(userId: string, name: string, data: ReccePlanData, jobId: string | null = null): ReccePlanDoc {
  const now = new Date().toISOString()
  const id = newPortalId('rp')
  getDb().prepare('INSERT INTO recce_plans (id, user_id, job_id, created_at, updated_at, name, data) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, userId, jobId, now, now, name, JSON.stringify(data))
  return { id, name, jobId: jobId ?? undefined, createdAt: now, updatedAt: now, data }
}

export function updateReccePlan(
  userId: string,
  id: string,
  patch: { name?: string, data?: ReccePlanData },
): ReccePlanDoc | null {
  const existing = getReccePlan(userId, id)
  if (!existing) return null
  const name = patch.name ?? existing.name
  const data = patch.data ?? existing.data
  const now = new Date().toISOString()
  getDb().prepare('UPDATE recce_plans SET name = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(name, JSON.stringify(data), now, id, userId)
  return { ...existing, name, data, updatedAt: now }
}

export function deleteReccePlan(userId: string, id: string): boolean {
  return getDb().prepare('DELETE FROM recce_plans WHERE id = ? AND user_id = ?').run(id, userId).changes > 0
}
