import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { LocationAlbumDetail, LocationAlbumPin, LocationAlbumSummary, LocationPhoto } from '~~/app/types'

// Default pin palette — kept in sync with PIN_COLORS in app/utils/locationMap.ts
// (the client's color picker). A folder with no color set falls back to a
// deterministic entry here so each location still gets a distinct pin.
const PIN_COLORS = [
  '#e6007e', '#ff9d00', '#2f80ed', '#26c6a2', '#8d6eff',
  '#f2c94c', '#eb5757', '#27ae60', '#f48fb1', '#00b8d9',
]

function pinColorForId(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return PIN_COLORS[Math.abs(h) % PIN_COLORS.length]!
}

// ─────────────────────────────────────────────────────────────────────────────
// Location photo albums (portal tool "tökustaðamyndir"): per-user folders of
// scouting photos, one folder per filming location. Folders nest (a folder can
// hold subfolders and photos), and each folder can carry a map pin (lat/lng) so
// every location shows up on an overview map. Every access is scoped by user_id,
// so one user can never read or write another's folders. The image files (a
// downscaled "full" plus a thumbnail, both generated in the browser) live in
// <dataDir>/location-photos and are streamed only through an authenticated,
// access-scoped endpoint — never via the public /uploads route.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_NAME = 120
const MAX_NOTE = 1000
const MAX_CAPTION = 300
/** How deep folders may nest (root = depth 1). Keeps the tree sane and cheap. */
const MAX_DEPTH = 8
/** A stored photo (already downscaled client-side to ~2560px). */
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024
/** The grid thumbnail (client-side, ~480px). */
export const MAX_THUMB_BYTES = 3 * 1024 * 1024

const fail = (message: string): never => {
  throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors: [message] } })
}

/** Album name is required short text. Pure (no DB) so it's unit-testable. */
export function validateAlbumName(input: unknown): string {
  const name = typeof input === 'string' ? input.trim().slice(0, MAX_NAME) : ''
  if (!name) fail('Name is required.')
  return name
}

/** Optional free-text note (address, notes about the location). Empty clears it. */
export function validateNote(input: unknown): string | null {
  const text = typeof input === 'string' ? input.trim() : ''
  if (text.length > MAX_NOTE) fail(`Note is too long (max ${MAX_NOTE} characters).`)
  return text.slice(0, MAX_NOTE) || null
}

/** Optional per-photo caption. Empty clears it. */
export function validateCaption(input: unknown): string | null {
  const text = typeof input === 'string' ? input.trim().slice(0, MAX_CAPTION) : ''
  return text || null
}

/**
 * A map pin: latitude/longitude within Earth bounds, rounded to ~10cm. Both must
 * be present. Pure (no DB) so it's unit-testable.
 */
export function validateCoords(lat: unknown, lng: unknown): { lat: number, lng: number } {
  const la = Number(lat)
  const ln = Number(lng)
  if (!Number.isFinite(la) || la < -90 || la > 90) fail('Latitude is out of range.')
  if (!Number.isFinite(ln) || ln < -180 || ln > 180) fail('Longitude is out of range.')
  return { lat: Math.round(la * 1e6) / 1e6, lng: Math.round(ln * 1e6) / 1e6 }
}

/** Optional pin color as a #rrggbb hex, or null to clear (inherit / default). */
export function validateColor(input: unknown): string | null {
  if (input === null || input === undefined || input === '') return null
  const s = String(input)
  if (!/^#[0-9a-f]{6}$/i.test(s)) fail('Invalid color.')
  return s.toLowerCase()
}

/** A 0–5 quality rating (0 = unrated). Pure (no DB) so it's unit-testable. */
export function validateRating(input: unknown): number {
  const n = Number(input)
  if (!Number.isInteger(n) || n < 0 || n > 5) fail('Rating must be a whole number from 0 to 5.')
  return n
}

/**
 * Images are accepted by content, not filename: JPEG, PNG or WebP. Returns the
 * extension + mime to store, or null for unsupported data.
 */
export function sniffImage(data: Buffer): { ext: string, mime: string } | null {
  if (data.subarray(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]))) return { ext: 'jpg', mime: 'image/jpeg' }
  if (data.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47]))) return { ext: 'png', mime: 'image/png' }
  if (data.subarray(0, 4).toString('latin1') === 'RIFF' && data.subarray(8, 12).toString('latin1') === 'WEBP') {
    return { ext: 'webp', mime: 'image/webp' }
  }
  return null
}

export const locationPhotoPath = (fileName: string) => join(locationPhotosDir(), fileName)

function rowToPhoto(r: Record<string, unknown>): LocationPhoto {
  return {
    id: r.id as string,
    albumId: r.album_id as string,
    createdAt: r.created_at as string,
    originalName: r.original_name as string,
    caption: (r.caption as string | null) ?? undefined,
    width: (r.width as number) ?? 0,
    height: (r.height as number) ?? 0,
    size: (r.size as number) ?? 0,
    sort: (r.sort as number) ?? 0,
  }
}

/** Album's own fields (no children/photos), for internal use. */
function rowToAlbum(r: Record<string, unknown>): LocationAlbumSummary {
  return {
    id: r.id as string,
    name: r.name as string,
    jobId: (r.job_id as string | null) ?? undefined,
    note: (r.note as string | null) ?? undefined,
    coverPhotoId: (r.cover_photo_id as string | null) ?? undefined,
    parentId: (r.parent_id as string | null) ?? undefined,
    lat: r.lat != null ? (r.lat as number) : undefined,
    lng: r.lng != null ? (r.lng as number) : undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    photoCount: (r.photo_count as number) ?? 0,
    childCount: (r.child_count as number) ?? 0,
    chosen: !!(r.chosen as number),
    rating: (r.rating as number) ?? 0,
    color: '', // resolved by the caller (needs the ancestor chain)
  }
}

/**
 * The pin color a folder shows: its own color, else the nearest ancestor's
 * (so option subfolders inherit the location's color), else a deterministic
 * default keyed to the location — the folder's parent, or itself if it's a root.
 */
function resolvedColor(albumId: string): string {
  const db = getDb()
  const row = db.prepare(`
    WITH RECURSIVE up(id, parent_id, color, depth) AS (
      SELECT id, parent_id, color, 0 FROM location_albums WHERE id = ?
      UNION ALL
      SELECT a.id, a.parent_id, a.color, up.depth + 1 FROM location_albums a JOIN up ON a.id = up.parent_id
    )
    SELECT color FROM up WHERE color IS NOT NULL ORDER BY depth LIMIT 1
  `).get(albumId) as { color: string } | undefined
  if (row?.color) return row.color
  const self = db.prepare('SELECT parent_id FROM location_albums WHERE id = ?')
    .get(albumId) as { parent_id: string | null } | undefined
  return pinColorForId(self?.parent_id ?? albumId)
}

/** The picked (chosen) direct option of a location folder, if any. */
function decidedOption(albumId: string): { id: string, name: string } | undefined {
  const row = getDb().prepare(`
    SELECT id, name FROM location_albums WHERE parent_id = ? AND chosen = 1 ORDER BY name COLLATE NOCASE LIMIT 1
  `).get(albumId) as { id: string, name: string } | undefined
  return row ?? undefined
}

/**
 * The cover photo for a folder: the pinned cover if it still lives directly in
 * the folder, otherwise the first photo found walking the folder and its whole
 * subtree (shallowest first). Lets a folder that only holds subfolders still
 * show a representative image.
 */
function resolveCover(albumId: string, pinned: string | null | undefined): string | null {
  const db = getDb()
  if (pinned) {
    const ok = db.prepare('SELECT 1 FROM location_photos WHERE id = ? AND album_id = ?').get(pinned, albumId)
    if (ok) return pinned
  }
  // Prefer a photo from a CHOSEN option in the subtree — the overview should show
  // the picked location's image once a decision is made.
  const chosen = db.prepare(`
    WITH RECURSIVE sub(id) AS (
      SELECT ?
      UNION ALL
      SELECT a.id FROM location_albums a JOIN sub ON a.parent_id = sub.id
    )
    SELECT p.id AS id FROM location_photos p
    JOIN location_albums a ON a.id = p.album_id
    JOIN sub ON sub.id = a.id
    WHERE a.chosen = 1
    ORDER BY p.sort, p.created_at LIMIT 1
  `).get(albumId) as { id: string } | undefined
  if (chosen?.id) return chosen.id
  // Otherwise the first photo anywhere in the subtree (shallowest first).
  const row = db.prepare(`
    WITH RECURSIVE sub(id, depth) AS (
      SELECT ?, 0
      UNION ALL
      SELECT a.id, sub.depth + 1 FROM location_albums a JOIN sub ON a.parent_id = sub.id
    )
    SELECT p.id AS id FROM location_photos p JOIN sub ON p.album_id = sub.id
    ORDER BY sub.depth, p.sort, p.created_at LIMIT 1
  `).get(albumId) as { id: string } | undefined
  return row?.id ?? null
}

/**
 * Direct subfolders (or root folders when parentId is null), scoped to the
 * owner. Pass a jobId to list only that job's root folders ("Hjálpargögn" on
 * the job page); it only applies to roots — subfolders inherit via their root.
 */
export function listChildren(userId: string, parentId: string | null, jobId?: string): LocationAlbumSummary[] {
  const jobFilter = jobId && parentId === null ? 'AND a.job_id = ?' : ''
  const params: (string | null)[] = jobFilter ? [userId, parentId, jobId!] : [userId, parentId]
  const rows = getDb().prepare(`
    SELECT a.id, a.name, a.note, a.job_id, a.parent_id, a.lat, a.lng, a.cover_photo_id, a.color, a.chosen, a.rating, a.created_at, a.updated_at,
      (SELECT COUNT(*) FROM location_photos p WHERE p.album_id = a.id) AS photo_count,
      (SELECT COUNT(*) FROM location_albums c WHERE c.parent_id = a.id) AS child_count
    FROM location_albums a
    WHERE a.user_id = ? AND a.parent_id IS ? ${jobFilter}
    ORDER BY a.name COLLATE NOCASE
  `).all(...params) as Record<string, unknown>[]
  return rows.map((r) => {
    const album = rowToAlbum(r)
    album.coverPhotoId = resolveCover(album.id, album.coverPhotoId) ?? undefined
    album.color = resolvedColor(album.id)
    const decided = decidedOption(album.id)
    if (decided) {
      album.decidedOptionId = decided.id
      album.decidedOptionName = decided.name
    }
    return album
  })
}

/** Ancestors from the root down to the folder's parent (excludes the folder itself). */
function breadcrumb(userId: string, parentId: string | null | undefined): { id: string, name: string }[] {
  const db = getDb()
  const trail: { id: string, name: string }[] = []
  const seen = new Set<string>()
  let pid = parentId ?? null
  while (pid && !seen.has(pid)) {
    seen.add(pid)
    const r = db.prepare('SELECT id, name, parent_id FROM location_albums WHERE id = ? AND user_id = ?')
      .get(pid, userId) as { id: string, name: string, parent_id: string | null } | undefined
    if (!r) break
    trail.unshift({ id: r.id, name: r.name })
    pid = r.parent_id
  }
  return trail
}

/** The job the folder's ROOT is linked to, if any (subfolders inherit it). */
function rootJobId(albumId: string): string | undefined {
  const row = getDb().prepare(`
    WITH RECURSIVE up(id, parent_id, job_id) AS (
      SELECT id, parent_id, job_id FROM location_albums WHERE id = ?
      UNION ALL
      SELECT a.id, a.parent_id, a.job_id FROM location_albums a JOIN up ON a.id = up.parent_id
    )
    SELECT job_id FROM up WHERE parent_id IS NULL LIMIT 1
  `).get(albumId) as { job_id: string | null } | undefined
  return row?.job_id ?? undefined
}

/** One folder with its photos, subfolders and ancestor trail, scoped to the owner. */
export function getAlbum(userId: string, id: string): LocationAlbumDetail | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM location_albums WHERE id = ? AND user_id = ?')
    .get(id, userId) as Record<string, unknown> | undefined
  if (!row) return null
  const self = rowToAlbum(row)
  const photos = db.prepare('SELECT * FROM location_photos WHERE album_id = ? ORDER BY sort, created_at')
    .all(id) as Record<string, unknown>[]
  return {
    id: self.id,
    name: self.name,
    // Inherited from the root so subfolder pages can link back to their job.
    jobId: rootJobId(id),
    note: self.note,
    coverPhotoId: self.coverPhotoId,
    parentId: self.parentId,
    lat: self.lat,
    lng: self.lng,
    color: (row.color as string | null) ?? undefined,
    displayColor: resolvedColor(id),
    chosen: self.chosen,
    rating: self.rating,
    createdAt: self.createdAt,
    updatedAt: self.updatedAt,
    photos: photos.map(rowToPhoto),
    children: listChildren(userId, id),
    breadcrumb: breadcrumb(userId, self.parentId),
  }
}

/** True if the album exists and belongs to the user (cheap ownership check). */
export function albumBelongsToUser(userId: string, id: string): boolean {
  return !!getDb().prepare('SELECT 1 FROM location_albums WHERE id = ? AND user_id = ?').get(id, userId)
}

export function createAlbum(userId: string, name: string, note: string | null, parentId: string | null, jobId: string | null = null): LocationAlbumDetail {
  if (parentId) {
    if (!albumBelongsToUser(userId, parentId)) fail('Parent folder not found.')
    // breadcrumb(parent) is the parent's ancestors; +1 for the parent itself.
    if (breadcrumb(userId, parentId).length + 1 >= MAX_DEPTH) fail('Folders are nested too deep.')
  }
  const now = new Date().toISOString()
  const id = newPortalId('la')
  // The job link lives on ROOT folders only; subfolders inherit via their root.
  getDb().prepare('INSERT INTO location_albums (id, user_id, job_id, created_at, updated_at, name, note, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, userId, parentId ? null : jobId, now, now, name, note, parentId)
  return getAlbum(userId, id)!
}

export function updateAlbum(
  userId: string,
  id: string,
  patch: {
    name?: string
    note?: string | null
    coverPhotoId?: string
    coords?: { lat: number, lng: number } | null
    color?: string | null
    chosen?: boolean
    rating?: number
  },
): LocationAlbumDetail | null {
  const db = getDb()
  const existing = getAlbum(userId, id)
  if (!existing) return null
  const name = patch.name ?? existing.name
  const note = patch.note !== undefined ? patch.note : (existing.note ?? null)
  // A cover must be a photo that lives directly in this folder.
  let coverPhotoId = existing.coverPhotoId ?? null
  if (patch.coverPhotoId !== undefined) {
    coverPhotoId = existing.photos.some(p => p.id === patch.coverPhotoId) ? patch.coverPhotoId : null
  }
  let lat = existing.lat ?? null
  let lng = existing.lng ?? null
  if (patch.coords !== undefined) {
    lat = patch.coords ? patch.coords.lat : null
    lng = patch.coords ? patch.coords.lng : null
  }
  const color = patch.color !== undefined ? patch.color : (existing.color ?? null)
  const chosen = patch.chosen !== undefined ? (patch.chosen ? 1 : 0) : (existing.chosen ? 1 : 0)
  const rating = patch.rating !== undefined ? patch.rating : existing.rating
  const now = new Date().toISOString()
  db.prepare('UPDATE location_albums SET name = ?, note = ?, cover_photo_id = ?, lat = ?, lng = ?, color = ?, chosen = ?, rating = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(name, note, coverPhotoId, lat, lng, color, chosen, rating, now, id, userId)
  return getAlbum(userId, id)
}

/** Delete a folder and its entire subtree (subfolders + all photos + files). */
export function deleteAlbum(userId: string, id: string): boolean {
  const db = getDb()
  if (!albumBelongsToUser(userId, id)) return false
  // Every descendant folder id (this subtree only belongs to this user).
  const ids = (db.prepare(`
    WITH RECURSIVE sub(id) AS (
      SELECT ?
      UNION ALL
      SELECT a.id FROM location_albums a JOIN sub ON a.parent_id = sub.id
    )
    SELECT id FROM sub
  `).all(id) as { id: string }[]).map(r => r.id)
  if (!ids.length) return false

  const placeholders = ids.map(() => '?').join(',')
  const files = db.prepare(`SELECT file_name, thumb_name FROM location_photos WHERE album_id IN (${placeholders})`)
    .all(...ids) as { file_name: string, thumb_name: string }[]
  // Deleting the album rows cascades their photo rows via the album_id FK.
  const gone = db.prepare(`DELETE FROM location_albums WHERE id IN (${placeholders})`).run(...ids).changes > 0
  if (gone) {
    for (const f of files) removePhotoFiles(f.file_name, f.thumb_name)
  }
  return gone
}

/**
 * Store one uploaded photo (a downscaled full image + its thumbnail, both from
 * the browser) into a folder the user owns. Bumps the folder's updated_at.
 */
export function addPhoto(userId: string, albumId: string, input: {
  full: Buffer
  thumb: Buffer
  originalName: string
  width: number
  height: number
}): LocationPhoto | null {
  const db = getDb()
  if (!albumBelongsToUser(userId, albumId)) return null

  const kind = sniffImage(input.full)
  if (!kind) fail('Images must be a JPEG, PNG or WebP file.')
  if (!sniffImage(input.thumb)) fail('The thumbnail is not a valid image.')

  const id = newPortalId('lp')
  const stamp = `${Date.now().toString(36)}-${id}`
  const fileName = `${stamp}.${kind!.ext}`
  const thumbName = `${stamp}.thumb.jpg`
  mkdirSync(locationPhotosDir(), { recursive: true })
  writeFileSync(locationPhotoPath(fileName), input.full)
  writeFileSync(locationPhotoPath(thumbName), input.thumb)

  const now = new Date().toISOString()
  try {
    db.transaction(() => {
      const { n } = db.prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS n FROM location_photos WHERE album_id = ?')
        .get(albumId) as { n: number }
      db.prepare(`
        INSERT INTO location_photos
          (id, album_id, user_id, created_at, file_name, thumb_name, mime, original_name, width, height, size, sort)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, albumId, userId, now, fileName, thumbName, kind!.mime,
        input.originalName.slice(0, 200), Math.max(0, Math.round(input.width)),
        Math.max(0, Math.round(input.height)), input.full.length, n)
      db.prepare('UPDATE location_albums SET updated_at = ? WHERE id = ?').run(now, albumId)
    })()
  }
  catch (err) {
    // Don't leave orphaned files behind when the insert fails.
    removePhotoFiles(fileName, thumbName)
    throw err
  }
  return {
    id, albumId, createdAt: now, originalName: input.originalName.slice(0, 200),
    width: Math.max(0, Math.round(input.width)), height: Math.max(0, Math.round(input.height)),
    size: input.full.length, sort: 0,
  }
}

/** Internal file names for a photo (never sent to the client). */
function photoFiles(userId: string, albumId: string, photoId: string): { file_name: string, thumb_name: string, mime: string } | null {
  const row = getDb().prepare(`
    SELECT p.file_name, p.thumb_name, p.mime
    FROM location_photos p
    JOIN location_albums a ON a.id = p.album_id
    WHERE p.id = ? AND p.album_id = ? AND a.user_id = ?
  `).get(photoId, albumId, userId) as { file_name: string, thumb_name: string, mime: string } | undefined
  return row ?? null
}

/** Resolve a photo's on-disk path + mime for streaming (owner-scoped). */
export function photoFileForStream(userId: string, albumId: string, photoId: string, size: 'full' | 'thumb'): { path: string, mime: string } | null {
  const row = photoFiles(userId, albumId, photoId)
  if (!row) return null
  return size === 'thumb'
    ? { path: locationPhotoPath(row.thumb_name), mime: 'image/jpeg' }
    : { path: locationPhotoPath(row.file_name), mime: row.mime }
}

export function updatePhoto(userId: string, albumId: string, photoId: string, patch: { caption: string | null }): LocationPhoto | null {
  const db = getDb()
  const changed = db.prepare(`
    UPDATE location_photos SET caption = ?
    WHERE id = ? AND album_id = ? AND album_id IN (SELECT id FROM location_albums WHERE user_id = ?)
  `).run(patch.caption, photoId, albumId, userId).changes
  if (!changed) return null
  const row = db.prepare('SELECT * FROM location_photos WHERE id = ?').get(photoId) as Record<string, unknown>
  return rowToPhoto(row)
}

export function deletePhoto(userId: string, albumId: string, photoId: string): boolean {
  const db = getDb()
  const row = photoFiles(userId, albumId, photoId)
  if (!row) return false
  const gone = db.prepare('DELETE FROM location_photos WHERE id = ? AND album_id = ?').run(photoId, albumId).changes > 0
  if (gone) {
    removePhotoFiles(row.file_name, row.thumb_name)
    // If this was the chosen cover, drop it so the folder falls back to another photo.
    db.prepare('UPDATE location_albums SET cover_photo_id = NULL WHERE id = ? AND cover_photo_id = ?').run(albumId, photoId)
  }
  return gone
}

/**
 * Folders with a map pin, for the overview map. Pass a rootId to limit to that
 * folder's subtree (itself + all descendants); omit for every pinned folder.
 * Pass a jobId to limit to folders whose ROOT is linked to that job.
 * The path is the folder-name trail from the root down to the folder.
 *
 * Selection: within one location (siblings sharing a parent), once any option is
 * chosen only the chosen options are returned — the rejected siblings drop off
 * the map. Root pins (no parent) are each their own group, so they never hide
 * one another. Each pin carries the location's resolved color and its chosen
 * flag; chosen pins are drawn with a star on the client.
 */
export function listPins(userId: string, rootId: string | null, jobId?: string): LocationAlbumPin[] {
  const rows = getDb().prepare(`
    SELECT a.id, a.name, a.job_id, a.parent_id, a.lat, a.lng, a.color, a.chosen, a.rating,
      (SELECT COUNT(*) FROM location_photos p WHERE p.album_id = a.id) AS photo_count
    FROM location_albums a WHERE a.user_id = ?
  `).all(userId) as Record<string, unknown>[]
  // Only leaf folders (options) are pins — a container ("tökustaður") never shows
  // as a pin even if it carries stale coordinates.
  const parents = new Set(rows.map(r => r.parent_id as string | null).filter(Boolean) as string[])

  const byId = new Map(rows.map(r => [r.id as string, r]))
  const pathOf = (r: Record<string, unknown>): string[] => {
    const names: string[] = []
    const seen = new Set<string>()
    let cur: Record<string, unknown> | undefined = r
    while (cur && !seen.has(cur.id as string)) {
      seen.add(cur.id as string)
      names.unshift(cur.name as string)
      const pid = cur.parent_id as string | null
      cur = pid ? byId.get(pid) : undefined
    }
    return names
  }
  const inSubtree = (r: Record<string, unknown>): boolean => {
    if (!rootId) return true
    const seen = new Set<string>()
    let cur: Record<string, unknown> | undefined = r
    while (cur && !seen.has(cur.id as string)) {
      if (cur.id === rootId) return true
      seen.add(cur.id as string)
      const pid = cur.parent_id as string | null
      cur = pid ? byId.get(pid) : undefined
    }
    return false
  }
  // Job scope: the link lives on the ROOT folder; a pin counts when its root
  // carries the requested job_id.
  const inJob = (r: Record<string, unknown>): boolean => {
    if (!jobId) return true
    const seen = new Set<string>()
    let cur: Record<string, unknown> | undefined = r
    while (cur && !seen.has(cur.id as string)) {
      seen.add(cur.id as string)
      const pid = cur.parent_id as string | null
      const parent = pid ? byId.get(pid) : undefined
      if (!parent) return cur.job_id === jobId
      cur = parent
    }
    return false
  }
  // Pin color: own color, else nearest ancestor's, else a default keyed to the
  // location (the pin's parent, or itself if it's a root).
  const colorOf = (r: Record<string, unknown>): string => {
    const seen = new Set<string>()
    let cur: Record<string, unknown> | undefined = r
    while (cur && !seen.has(cur.id as string)) {
      if (cur.color) return cur.color as string
      seen.add(cur.id as string)
      const pid = cur.parent_id as string | null
      cur = pid ? byId.get(pid) : undefined
    }
    return pinColorForId((r.parent_id as string | null) ?? (r.id as string))
  }

  const pinned = rows.filter(r =>
    r.lat != null && r.lng != null && !parents.has(r.id as string) && inSubtree(r) && inJob(r))
  // Which location groups (by parent) contain at least one chosen option.
  const decidedGroups = new Set<string>()
  for (const r of pinned) {
    if (r.chosen) decidedGroups.add((r.parent_id as string | null) ?? (r.id as string))
  }

  return pinned
    .filter((r) => {
      const group = (r.parent_id as string | null) ?? (r.id as string)
      // Once a location has a chosen option, hide its unchosen pins.
      return !decidedGroups.has(group) || !!r.chosen
    })
    .map(r => ({
      id: r.id as string,
      name: r.name as string,
      lat: r.lat as number,
      lng: r.lng as number,
      photoCount: (r.photo_count as number) ?? 0,
      path: pathOf(r),
      color: colorOf(r),
      chosen: !!r.chosen,
      rating: (r.rating as number) ?? 0,
      coverPhotoId: resolveCover(r.id as string, null) ?? undefined,
    }))
}

function removePhotoFiles(fileName: string, thumbName: string) {
  for (const f of [fileName, thumbName]) {
    try {
      unlinkSync(locationPhotoPath(f))
    }
    catch { /* already gone — nothing to clean up */ }
  }
}
