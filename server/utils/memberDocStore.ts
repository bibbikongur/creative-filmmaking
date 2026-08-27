import { randomBytes } from 'node:crypto'
import type { DocKind, MemberDoc, MemberDocStatus } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Built-in contract/NDA signing requests. One row per (job, user, kind);
// resending overwrites the row and invalidates the previous link. The emailed
// token is stored hashed (like invite tokens); the signed, stamped PDF lands
// in <dataDir>/signed-docs and is only served through requireJobAdmin.
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // signing links last 30 days

function rowToDoc(r: Record<string, unknown>): MemberDoc {
  return {
    userId: r.user_id as string,
    kind: r.kind as DocKind,
    status: r.status as MemberDocStatus,
    sentAt: r.sent_at as string,
    completedAt: (r.completed_at as string | null) ?? undefined,
    signedName: (r.signed_name as string | null) ?? undefined,
    hasFile: Boolean(r.signed_file),
  }
}

export function listMemberDocs(jobId: string): MemberDoc[] {
  const rows = getDb().prepare('SELECT * FROM member_docs WHERE job_id = ?').all(jobId) as Record<string, unknown>[]
  return rows.map(rowToDoc)
}

/** Create (or replace) a signing request and return the raw token for the email link. */
export function createSigningRequest(input: {
  jobId: string
  userId: string
  kind: DocKind
  sentBy: string
}): { doc: MemberDoc, token: string } {
  const token = randomBytes(32).toString('base64url')
  const now = new Date().toISOString()
  getDb().prepare(`
    INSERT INTO member_docs (job_id, user_id, kind, status, token_hash, token_expires_at, sent_at, sent_by)
    VALUES (?, ?, ?, 'sent', ?, ?, ?, ?)
    ON CONFLICT (job_id, user_id, kind) DO UPDATE SET
      status = 'sent', token_hash = excluded.token_hash,
      token_expires_at = excluded.token_expires_at, sent_at = excluded.sent_at,
      sent_by = excluded.sent_by, viewed_at = NULL, completed_at = NULL,
      signed_name = NULL, signed_ip = NULL, signed_file = NULL
  `).run(input.jobId, input.userId, input.kind, hashToken(token),
    new Date(Date.now() + TOKEN_TTL_MS).toISOString(), now, input.sentBy)
  return {
    doc: { userId: input.userId, kind: input.kind, status: 'sent', sentAt: now, hasFile: false },
    token,
  }
}

export interface SigningRequestRow {
  id: number
  jobId: string
  userId: string
  kind: DocKind
  status: MemberDocStatus
  sentBy: string
  sentAt: string
}

/** Look up a signing request by its raw token. Signed/declined/expired links are dead. */
export function findSigningRequest(rawToken: string): SigningRequestRow | null {
  const row = getDb().prepare(`
    SELECT id, job_id, user_id, kind, status, sent_by, sent_at, token_expires_at FROM member_docs
    WHERE token_hash = ? AND status IN ('sent', 'delivered')
  `).get(hashToken(rawToken)) as Record<string, unknown> | undefined
  if (!row) return null
  if (new Date(String(row.token_expires_at)) < new Date()) return null
  return {
    id: row.id as number,
    jobId: row.job_id as string,
    userId: row.user_id as string,
    kind: row.kind as DocKind,
    status: row.status as MemberDocStatus,
    sentBy: row.sent_by as string,
    sentAt: row.sent_at as string,
  }
}

/** First open of the signing link: sent → delivered. */
export function markViewed(id: number): void {
  getDb().prepare(`
    UPDATE member_docs SET status = 'delivered', viewed_at = COALESCE(viewed_at, ?)
    WHERE id = ? AND status = 'sent'
  `).run(new Date().toISOString(), id)
}

export function completeSigning(id: number, input: { signedName: string, ip: string, fileName: string }): void {
  getDb().prepare(`
    UPDATE member_docs SET status = 'completed', completed_at = ?, signed_name = ?,
      signed_ip = ?, signed_file = ?, token_hash = NULL
    WHERE id = ?
  `).run(new Date().toISOString(), input.signedName, input.ip, input.fileName, id)
}

export function declineSigning(id: number): void {
  getDb().prepare('UPDATE member_docs SET status = \'declined\', token_hash = NULL WHERE id = ?')
    .run(id)
}

/** Stored filename of the signed PDF, for the admin download endpoint. */
export function getSignedFileName(jobId: string, userId: string, kind: DocKind): string | null {
  const row = getDb().prepare(`
    SELECT signed_file FROM member_docs WHERE job_id = ? AND user_id = ? AND kind = ? AND status = 'completed'
  `).get(jobId, userId, kind) as { signed_file: string | null } | undefined
  return row?.signed_file ?? null
}
