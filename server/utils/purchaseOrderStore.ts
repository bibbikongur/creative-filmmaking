import { randomBytes } from 'node:crypto'
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PurchaseOrder, PurchaseOrderCostCode, PurchaseOrderJob, PurchaseOrderStatus } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Purchase orders (portal tool "innkaupabeiðnir", a light DPO). Department
// admins log costs for their own department; the company admin sees every
// order on the job and approves or rejects each one. po_number is a per-job
// sequence (PO-001, PO-002, …). Attachments (receipt photos/PDFs) live in
// <dataDir>/po-attachments and are streamed only through an authenticated,
// access-scoped endpoint.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_VENDOR = 120
const MAX_DESCRIPTION = 1000
const MAX_NOTE = 500
const MAX_AMOUNT = 100_000_000
export const MAX_PO_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10 MB

const fail = (message: string): never => {
  throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors: [message] } })
}

/** Vendor is required short text. Pure (no DB) so it's unit-testable. */
export function validateVendor(input: unknown): string {
  const vendor = typeof input === 'string' ? input.trim().slice(0, MAX_VENDOR) : ''
  if (!vendor) fail('Vendor is required.')
  return vendor
}

/** Optional free-text description; empty clears to null. */
export function validateDescription(input: unknown): string | null {
  const text = typeof input === 'string' ? input.trim() : ''
  if (text.length > MAX_DESCRIPTION) fail(`Description is too long (max ${MAX_DESCRIPTION} characters).`)
  return text || null
}

/** Whole ISK amount above 0. Pure (no DB) so it's unit-testable. */
export function validateAmount(input: unknown): number {
  const amount = Number(input)
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    fail('Amount must be a whole ISK amount above 0.')
  }
  return amount
}

/** Optional decision note from the reviewer. */
export function validateDecisionNote(input: unknown): string | null {
  const text = typeof input === 'string' ? input.trim().slice(0, MAX_NOTE) : ''
  return text || null
}

/** Cost-code number, e.g. "4110". Pure (no DB) so it's unit-testable. */
export function validateCostCode(input: unknown): string {
  const code = typeof input === 'string' ? input.trim().slice(0, 20) : ''
  if (!code) fail('Cost-code number is required.')
  return code
}

/** Cost-code name, e.g. "Leikmynd". Pure (no DB) so it's unit-testable. */
export function validateCostCodeName(input: unknown): string {
  const name = typeof input === 'string' ? input.trim().slice(0, 80) : ''
  if (!name) fail('Cost-code name is required.')
  return name
}

const MAX_BUDGET = 10_000_000_000

/** Icelandic VAT rates. */
const VAT_RATES = [0, 11, 24]

/** VAT rate on the invoice: 0, 11 or 24; empty clears to null (unknown). Pure. */
export function validateVatRate(input: unknown): number | null {
  if (input === undefined || input === null || input === '') return null
  const rate = Number(input)
  if (!VAT_RATES.includes(rate)) fail('VAT rate must be 0, 11 or 24.')
  return rate
}

/** Actual invoiced amount (may differ from the logged estimate); empty clears to null. Pure. */
export function validateActualAmount(input: unknown): number | null {
  if (input === undefined || input === null || input === '') return null
  const amount = Number(input)
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    fail('Actual amount must be a whole ISK amount above 0.')
  }
  return amount
}

/** Optional cost-code budget: whole ISK above 0, empty clears to null. Pure. */
export function validateBudget(input: unknown): number | null {
  if (input === undefined || input === null || input === '') return null
  const budget = Number(input)
  if (!Number.isFinite(budget) || !Number.isInteger(budget) || budget <= 0 || budget > MAX_BUDGET) {
    fail('Budget must be a whole ISK amount above 0.')
  }
  return budget
}

/**
 * Attachments are accepted by content, not filename: JPEG, PNG, WebP or PDF.
 * Returns the extension + mime to store, or null for unsupported data.
 */
export function sniffAttachment(data: Buffer): { ext: string, mime: string } | null {
  if (data.subarray(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]))) return { ext: 'jpg', mime: 'image/jpeg' }
  if (data.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47]))) return { ext: 'png', mime: 'image/png' }
  if (data.subarray(0, 4).toString('latin1') === 'RIFF' && data.subarray(8, 12).toString('latin1') === 'WEBP') {
    return { ext: 'webp', mime: 'image/webp' }
  }
  if (data.subarray(0, 5).toString('latin1') === '%PDF-') return { ext: 'pdf', mime: 'application/pdf' }
  return null
}

export const poAttachmentPath = (fileName: string) => join(poAttachmentsDir(), fileName)

/** Mime type for a stored attachment, derived from the extension we chose at save time. */
export function poAttachmentMime(fileName: string): string {
  if (fileName.endsWith('.jpg')) return 'image/jpeg'
  if (fileName.endsWith('.png')) return 'image/png'
  if (fileName.endsWith('.webp')) return 'image/webp'
  return 'application/pdf'
}

function rowToOrder(r: Record<string, unknown>): PurchaseOrder {
  return {
    id: r.id as string,
    jobId: r.job_id as string,
    poNumber: r.po_number as number,
    createdAt: r.created_at as string,
    vendor: r.vendor as string,
    description: (r.description as string | null) ?? undefined,
    amount: r.amount as number,
    status: r.status as PurchaseOrderStatus,
    createdById: r.user_id as string,
    createdByName: (r.created_by_name as string | null) || (r.created_by_email as string),
    departmentId: (r.department_id as string | null) ?? undefined,
    departmentName: (r.department_name as string | null) ?? undefined,
    decidedAt: (r.decided_at as string | null) ?? undefined,
    decidedByName: (r.decided_by_name as string | null) ?? undefined,
    decisionNote: (r.decision_note as string | null) ?? undefined,
    paidAt: (r.paid_at as string | null) ?? undefined,
    paidByName: (r.paid_by_name as string | null) ?? undefined,
    vatRate: (r.vat_rate as number | null) ?? undefined,
    rebateEligible: Boolean(r.rebate_eligible),
    actualAmount: (r.actual_amount as number | null) ?? undefined,
    attachmentName: (r.attachment_name as string | null) ?? undefined,
    costCodeId: (r.cost_code_id as string | null) ?? undefined,
    costCode: (r.cost_code as string | null) ?? undefined,
    costCodeName: (r.cost_code_name as string | null) ?? undefined,
  }
}

const SELECT_ORDERS = `
  SELECT po.*,
    cu.name AS created_by_name, cu.email AS created_by_email,
    COALESCE(du.name, du.email) AS decided_by_name,
    COALESCE(pu.name, pu.email) AS paid_by_name,
    d.name AS department_name,
    cc.code AS cost_code, cc.name AS cost_code_name
  FROM purchase_orders po
  JOIN portal_users cu ON cu.id = po.user_id
  LEFT JOIN portal_users du ON du.id = po.decided_by
  LEFT JOIN portal_users pu ON pu.id = po.paid_by
  LEFT JOIN departments d ON d.id = po.department_id
  LEFT JOIN po_cost_codes cc ON cc.id = po.cost_code_id
`

/**
 * SQL fragment + params matching a department scope: any of the listed
 * departments, where a null element matches department-less rows.
 */
function deptScopeSql(column: string, departmentIds: (string | null)[]): { sql: string, params: string[] } {
  const ids = departmentIds.filter((d): d is string => d !== null)
  const withNull = departmentIds.includes(null)
  const parts: string[] = []
  if (ids.length) parts.push(`${column} IN (${ids.map(() => '?').join(', ')})`)
  if (withNull) parts.push(`${column} IS NULL`)
  // An empty scope matches nothing.
  return { sql: parts.length ? `(${parts.join(' OR ')})` : '0', params: ids }
}

/**
 * A job's orders. No scope = every order; a scope restricts to the listed
 * departments (a null element means the department-less orders). Wages orders
 * (booked from approved timesheets) are excluded from scoped views — weekly
 * wage totals are only for viewers the admin granted job-wide visibility.
 */
export function listPurchaseOrders(jobId: string, scope?: { departmentIds: (string | null)[] }): PurchaseOrder[] {
  const db = getDb()
  if (!scope) {
    return (db.prepare(`${SELECT_ORDERS} WHERE po.job_id = ? ORDER BY po.po_number DESC`)
      .all(jobId) as Record<string, unknown>[]).map(rowToOrder)
  }
  const { sql, params } = deptScopeSql('po.department_id', scope.departmentIds)
  return (db.prepare(`${SELECT_ORDERS} WHERE po.job_id = ? AND ${sql} AND po.timesheet_week_id IS NULL ORDER BY po.po_number DESC`)
    .all(jobId, ...params) as Record<string, unknown>[]).map(rowToOrder)
}

export function getPurchaseOrder(jobId: string, id: string): PurchaseOrder | null {
  const row = getDb().prepare(`${SELECT_ORDERS} WHERE po.id = ? AND po.job_id = ?`)
    .get(id, jobId) as Record<string, unknown> | undefined
  return row ? rowToOrder(row) : null
}

/** Stored attachment file name (internal — never sent to the client). */
export function poAttachmentFile(jobId: string, id: string): string | null {
  const row = getDb().prepare('SELECT attachment_file FROM purchase_orders WHERE id = ? AND job_id = ?')
    .get(id, jobId) as { attachment_file: string | null } | undefined
  return row?.attachment_file ?? null
}

export function createPurchaseOrder(jobId: string, input: {
  userId: string
  departmentId: string | null
  costCodeId?: string | null
  vendor: string
  description: string | null
  amount: number
  vatRate?: number | null
  rebateEligible?: boolean
  attachment?: { data: Buffer, originalName: string }
}): PurchaseOrder {
  let attachmentFile: string | null = null
  let attachmentName: string | null = null
  if (input.attachment) {
    const kind = sniffAttachment(input.attachment.data)
    if (!kind) fail('Attachments must be a JPEG, PNG, WebP or PDF file.')
    attachmentFile = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}.${kind!.ext}`
    attachmentName = input.attachment.originalName.slice(0, 200)
    mkdirSync(poAttachmentsDir(), { recursive: true })
    writeFileSync(poAttachmentPath(attachmentFile), input.attachment.data)
  }

  const db = getDb()
  const id = newPortalId('po')
  try {
    // IMMEDIATE: the MAX+1 read and the insert must not interleave with
    // another writer, or two orders could claim the same po_number.
    db.transaction(() => {
      const { n } = db.prepare('SELECT COALESCE(MAX(po_number), 0) + 1 AS n FROM purchase_orders WHERE job_id = ?')
        .get(jobId) as { n: number }
      db.prepare(`
        INSERT INTO purchase_orders
          (id, job_id, user_id, department_id, cost_code_id, created_at, po_number, vendor, description, amount, vat_rate, rebate_eligible, attachment_file, attachment_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, jobId, input.userId, input.departmentId, input.costCodeId ?? null, new Date().toISOString(), n,
        input.vendor, input.description, input.amount, input.vatRate ?? null, input.rebateEligible ? 1 : 0,
        attachmentFile, attachmentName)
    }).immediate()
  }
  catch (err) {
    // Don't leave an orphaned file behind when the insert fails.
    if (attachmentFile) {
      try {
        unlinkSync(poAttachmentPath(attachmentFile))
      }
      catch { /* nothing to clean up */ }
    }
    throw err
  }
  return getPurchaseOrder(jobId, id)!
}

/**
 * Approve or reject. Re-deciding is allowed (misclicks happen); caller guards
 * to job admins. Rejecting clears any paid mark — a rejected cost can't be paid.
 */
export function decidePurchaseOrder(jobId: string, id: string, input: {
  status: Exclude<PurchaseOrderStatus, 'pending'>
  decidedBy: string
  note: string | null
}): PurchaseOrder | null {
  const clearPaid = input.status === 'rejected' ? ', paid_at = NULL, paid_by = NULL, actual_amount = NULL' : ''
  const changes = getDb().prepare(`
    UPDATE purchase_orders SET status = ?, decided_at = ?, decided_by = ?, decision_note = ?${clearPaid}
    WHERE id = ? AND job_id = ?
  `).run(input.status, new Date().toISOString(), input.decidedBy, input.note, id, jobId).changes
  return changes ? getPurchaseOrder(jobId, id) : null
}

/**
 * Mark an approved order as paid (or clear the mark). Caller guards to job
 * admins. The actual invoiced amount belongs to the payment event: recorded
 * when marking paid, cleared when un-marking.
 */
export function setPurchaseOrderPaid(jobId: string, id: string, input: {
  paid: boolean
  userId: string
  actualAmount?: number | null
}): PurchaseOrder | null {
  const existing = getPurchaseOrder(jobId, id)
  if (!existing) return null
  if (input.paid && existing.status !== 'approved') {
    throw createError({ statusCode: 409, statusMessage: 'Only approved orders can be marked as paid.' })
  }
  getDb().prepare('UPDATE purchase_orders SET paid_at = ?, paid_by = ?, actual_amount = ? WHERE id = ? AND job_id = ?')
    .run(input.paid ? new Date().toISOString() : null, input.paid ? input.userId : null,
      input.paid ? (input.actualAmount ?? null) : null, id, jobId)
  return getPurchaseOrder(jobId, id)
}

/** Patch VAT rate, rebate flag or actual amount on an order. Caller guards to job admins. */
export function setPurchaseOrderMeta(jobId: string, id: string, patch: {
  vatRate?: number | null
  rebateEligible?: boolean
  actualAmount?: number | null
}): PurchaseOrder | null {
  const sets: string[] = []
  const values: unknown[] = []
  if (patch.vatRate !== undefined) {
    sets.push('vat_rate = ?')
    values.push(patch.vatRate)
  }
  if (patch.rebateEligible !== undefined) {
    sets.push('rebate_eligible = ?')
    values.push(patch.rebateEligible ? 1 : 0)
  }
  if (patch.actualAmount !== undefined) {
    sets.push('actual_amount = ?')
    values.push(patch.actualAmount)
  }
  if (!sets.length) return getPurchaseOrder(jobId, id)
  const changes = getDb().prepare(`UPDATE purchase_orders SET ${sets.join(', ')} WHERE id = ? AND job_id = ?`)
    .run(...values, id, jobId).changes
  return changes ? getPurchaseOrder(jobId, id) : null
}

/** Attach (or replace) the invoice/receipt file on an existing order. */
export function setPurchaseOrderAttachment(jobId: string, id: string, input: {
  data: Buffer
  originalName: string
}): PurchaseOrder | null {
  const existing = getPurchaseOrder(jobId, id)
  if (!existing) return null

  const kind = sniffAttachment(input.data)
  if (!kind) fail('Attachments must be a JPEG, PNG, WebP or PDF file.')
  const fileName = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}.${kind!.ext}`
  mkdirSync(poAttachmentsDir(), { recursive: true })
  writeFileSync(poAttachmentPath(fileName), input.data)

  // Don't leave the new file orphaned when the row vanished or the update fails.
  const dropNewFile = () => {
    try {
      unlinkSync(poAttachmentPath(fileName))
    }
    catch { /* nothing to clean up */ }
  }
  const previous = poAttachmentFile(jobId, id)
  let changes = 0
  try {
    changes = getDb().prepare('UPDATE purchase_orders SET attachment_file = ?, attachment_name = ? WHERE id = ? AND job_id = ?')
      .run(fileName, input.originalName.slice(0, 200), id, jobId).changes
  }
  catch (err) {
    dropNewFile()
    throw err
  }
  if (!changes) {
    dropNewFile()
    return null
  }
  if (previous) {
    try {
      unlinkSync(poAttachmentPath(previous))
    }
    catch { /* already gone — nothing to clean up */ }
  }
  return getPurchaseOrder(jobId, id)
}

/**
 * Move an order to another department (or none). Caller guards to job admins.
 * A booking on a code tied to a DIFFERENT department is cleared in the same
 * transaction — the new department could never see (or have picked) that code.
 */
export function setPurchaseOrderDepartment(jobId: string, id: string, departmentId: string | null): PurchaseOrder | null {
  const db = getDb()
  let changes = 0
  db.transaction(() => {
    changes = db.prepare('UPDATE purchase_orders SET department_id = ? WHERE id = ? AND job_id = ?')
      .run(departmentId, id, jobId).changes
    if (changes) {
      db.prepare(`
        UPDATE purchase_orders SET cost_code_id = NULL
        WHERE id = ? AND job_id = ? AND cost_code_id IN (
          SELECT cc.id FROM po_cost_codes cc
          WHERE cc.department_id IS NOT NULL AND cc.department_id IS NOT ?
        )
      `).run(id, jobId, departmentId)
    }
  })()
  return changes ? getPurchaseOrder(jobId, id) : null
}

/** Re-book an order onto another cost code (or none). Caller guards to job admins. */
export function setPurchaseOrderCostCode(jobId: string, id: string, costCodeId: string | null): PurchaseOrder | null {
  const changes = getDb().prepare('UPDATE purchase_orders SET cost_code_id = ? WHERE id = ? AND job_id = ?')
    .run(costCodeId, id, jobId).changes
  return changes ? getPurchaseOrder(jobId, id) : null
}

/** Delete an order and its attachment. Caller enforces who may (creator while pending, or job admin). */
export function deletePurchaseOrder(jobId: string, id: string): boolean {
  const file = poAttachmentFile(jobId, id)
  const gone = getDb().prepare('DELETE FROM purchase_orders WHERE id = ? AND job_id = ?').run(id, jobId).changes > 0
  if (gone && file) {
    try {
      unlinkSync(poAttachmentPath(file))
    }
    catch { /* already gone — nothing to clean up */ }
  }
  return gone
}

// ── Cost codes (bókhaldslyklar) ──────────────────────────────────────────────

function rowToCostCode(r: Record<string, unknown>): PurchaseOrderCostCode {
  return {
    id: r.id as string,
    code: r.code as string,
    name: r.name as string,
    departmentId: (r.department_id as string | null) ?? undefined,
    departmentName: (r.department_name as string | null) ?? undefined,
    budget: (r.budget as number | null) ?? undefined,
  }
}

/**
 * The job's cost codes. No scope = every code; a scope restricts to what the
 * listed departments may book on: their own codes plus the shared
 * (department-less) ones.
 */
export function listCostCodes(jobId: string, scope?: { departmentIds: (string | null)[] }): PurchaseOrderCostCode[] {
  const base = `
    SELECT cc.id, cc.code, cc.name, cc.department_id, cc.budget, d.name AS department_name
    FROM po_cost_codes cc LEFT JOIN departments d ON d.id = cc.department_id
    WHERE cc.job_id = ?
  `
  if (!scope) {
    return (getDb().prepare(`${base} ORDER BY cc.code`).all(jobId) as Record<string, unknown>[]).map(rowToCostCode)
  }
  // Shared codes are always usable, so the null element is implicit here.
  const { sql, params } = deptScopeSql('cc.department_id', [...scope.departmentIds, null])
  return (getDb().prepare(`${base} AND ${sql} ORDER BY cc.code`)
    .all(jobId, ...params) as Record<string, unknown>[]).map(rowToCostCode)
}

export function getCostCode(jobId: string, id: string): PurchaseOrderCostCode | null {
  const row = getDb().prepare(`
    SELECT cc.id, cc.code, cc.name, cc.department_id, cc.budget, d.name AS department_name
    FROM po_cost_codes cc LEFT JOIN departments d ON d.id = cc.department_id
    WHERE cc.id = ? AND cc.job_id = ?
  `).get(id, jobId) as Record<string, unknown> | undefined
  return row ? rowToCostCode(row) : null
}

export function costCodeBelongsToJob(costCodeId: string, jobId: string): boolean {
  return Boolean(getDb().prepare('SELECT 1 FROM po_cost_codes WHERE id = ? AND job_id = ?').get(costCodeId, jobId))
}

export function createCostCode(jobId: string, input: {
  code: string
  name: string
  departmentId: string | null
  budget?: number | null
}): PurchaseOrderCostCode {
  const id = newPortalId('cc')
  try {
    getDb().prepare('INSERT INTO po_cost_codes (id, job_id, department_id, created_at, code, name, budget) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, jobId, input.departmentId, new Date().toISOString(), input.code, input.name, input.budget ?? null)
  }
  catch (err) {
    if ((err as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      fail('A cost code with this number already exists on this job.')
    }
    throw err
  }
  return getCostCode(jobId, id)!
}

/**
 * Re-pointing a code to another department leaves existing bookings untouched:
 * the admin sees every order regardless, and per-code reporting stays correct.
 * (Moving an ORDER between departments does clear a mismatched code — see
 * setPurchaseOrderDepartment.)
 */
export function updateCostCode(jobId: string, id: string, input: {
  code: string
  name: string
  departmentId: string | null
  budget?: number | null
}): PurchaseOrderCostCode | null {
  try {
    const changes = getDb().prepare('UPDATE po_cost_codes SET code = ?, name = ?, department_id = ?, budget = ? WHERE id = ? AND job_id = ?')
      .run(input.code, input.name, input.departmentId, input.budget ?? null, id, jobId).changes
    return changes ? getCostCode(jobId, id) : null
  }
  catch (err) {
    if ((err as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      fail('A cost code with this number already exists on this job.')
    }
    throw err
  }
}

/** Delete a code and un-book its orders (they stay, just without a code). */
export function deleteCostCode(jobId: string, id: string): boolean {
  const db = getDb()
  let gone = false
  db.transaction(() => {
    db.prepare('UPDATE purchase_orders SET cost_code_id = NULL WHERE job_id = ? AND cost_code_id = ?').run(jobId, id)
    gone = db.prepare('DELETE FROM po_cost_codes WHERE id = ? AND job_id = ?').run(id, jobId).changes > 0
  })()
  return gone
}

/**
 * Recipients of new-order notices: the job's active company admins plus any
 * member holding the 'approve' purchase-order role.
 */
export function listJobAdminRecipients(jobId: string): { email: string, name?: string, locale: 'en' | 'is' }[] {
  const rows = getDb().prepare(`
    SELECT u.email, u.name, u.locale FROM jobs j
    JOIN company_admins ca ON ca.company_id = j.company_id
    JOIN portal_users u ON u.id = ca.user_id AND u.status = 'active'
    WHERE j.id = ?
    UNION
    SELECT u.email, u.name, u.locale FROM job_members m
    JOIN portal_users u ON u.id = m.user_id AND u.status = 'active'
    WHERE m.job_id = ? AND m.status = 'active' AND m.po_role = 'approve'
  `).all(jobId, jobId) as Record<string, unknown>[]
  return rows.map(r => ({
    email: r.email as string,
    name: (r.name as string | null) ?? undefined,
    locale: r.locale as 'en' | 'is',
  }))
}

/**
 * Jobs where the user can use the tool: every job of a company they admin,
 * plus jobs where their po_role (or the derived dept-admin default) grants
 * access. Admin wins when both apply. Closed jobs stay listed so old costs
 * remain reachable.
 */
export function listPurchaseOrderJobs(userId: string): PurchaseOrderJob[] {
  const db = getDb()
  const adminJobs = db.prepare(`
    SELECT j.id AS job_id, j.name AS job_name, c.name AS company_name
    FROM company_admins ca
    JOIN companies c ON c.id = ca.company_id AND c.status = 'active'
    JOIN jobs j ON j.company_id = ca.company_id
    WHERE ca.user_id = ?
    ORDER BY j.status, j.created_at DESC
  `).all(userId) as Record<string, unknown>[]

  const memberJobs = db.prepare(`
    SELECT j.id AS job_id, j.name AS job_name, c.name AS company_name,
      m.po_role, d.id AS department_id, d.name AS department_name
    FROM job_members m
    LEFT JOIN departments d ON d.id = m.department_id
    JOIN jobs j ON j.id = m.job_id
    JOIN companies c ON c.id = j.company_id AND c.status = 'active'
    WHERE m.user_id = ? AND m.status = 'active'
      AND (
        m.po_role IN ('log', 'log_all', 'view', 'approve')
        OR (m.po_role IS NULL AND m.is_dept_admin = 1 AND m.department_id IS NOT NULL)
      )
    ORDER BY j.status, j.created_at DESC
  `).all(userId) as Record<string, unknown>[]

  const out: PurchaseOrderJob[] = adminJobs.map(r => ({
    jobId: r.job_id as string,
    jobName: r.job_name as string,
    companyName: r.company_name as string,
    isJobAdmin: true,
    poRole: 'admin',
  }))
  for (const r of memberJobs) {
    if (out.some(j => j.jobId === r.job_id)) continue
    const role = ((r.po_role as string | null) ?? 'log') as 'log' | 'log_all' | 'view' | 'approve'
    out.push({
      jobId: r.job_id as string,
      jobName: r.job_name as string,
      companyName: r.company_name as string,
      isJobAdmin: role === 'approve',
      poRole: role,
      departmentId: (r.department_id as string | null) ?? undefined,
      departmentName: (r.department_name as string | null) ?? undefined,
    })
  }
  return out
}
