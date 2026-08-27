import type { PurchaseOrder, PurchaseOrderCostCode } from '~/types'

// Pure report model for the purchase-order cost report (kostnaðarskýrsla).
// No Vue/Nuxt imports so it stays unit-testable. Money semantics: the actual
// invoiced amount (recorded by the admin at payment) supersedes the logged
// estimate everywhere — recording it counts as an auto-approved cost change —
// so committed, paid, VAT and rebate all use the effective amount. Rejected
// orders carry no money but stay listed in the detail section as an audit trail.

/** VAT portion of a gross ISK amount. net + vat always equals amount exactly. */
export function vatPortion(amount: number, rate?: number): number {
  if (!rate || rate <= 0) return 0
  const net = Math.round(amount / (1 + rate / 100))
  return amount - net
}

export interface PoReportCodeRow {
  code: string
  name: string
  /** Empty for shared codes and the "no code" bucket. */
  departmentName: string
  budget: number
  committed: number
  paid: number
  vat: number
  rebate: number
  /** budget - committed; 0 when the code has no budget. */
  remaining: number
  /** Usage % of budget; 0 when the code has no budget. */
  pct: number
  count: number
}

export interface PoReportOrderRow {
  poNumber: number
  /** yyyy-mm-dd */
  dateIso: string
  vendor: string
  description: string
  departmentName: string
  code: string
  amount: number
  vatRate: number | null
  status: 'pending' | 'approved' | 'rejected'
  paid: boolean
  actualAmount: number | null
  rebateEligible: boolean
}

export interface PoReport {
  codeRows: PoReportCodeRow[]
  deptSubtotals: { name: string, committed: number, paid: number, count: number }[]
  grand: { budget: number, committed: number, paid: number, vat: number, rebate: number, count: number }
  orders: PoReportOrderRow[]
}

export function buildPoReport(orders: PurchaseOrder[], costCodes: PurchaseOrderCostCode[]): PoReport {
  const codeMap = new Map<string, PoReportCodeRow>()
  // Budgeted codes always get a row, even before anything is booked on them.
  for (const c of costCodes) {
    if (!c.budget) continue
    codeMap.set(c.id, {
      code: c.code,
      name: c.name,
      departmentName: c.departmentName ?? '',
      budget: c.budget,
      committed: 0,
      paid: 0,
      vat: 0,
      rebate: 0,
      remaining: c.budget,
      pct: 0,
      count: 0,
    })
  }

  const deptMap = new Map<string, { name: string, committed: number, paid: number, count: number }>()
  const grand = { budget: 0, committed: 0, paid: 0, vat: 0, rebate: 0, count: 0 }
  const orderRows: PoReportOrderRow[] = []

  for (const o of orders) {
    orderRows.push({
      poNumber: o.poNumber,
      dateIso: o.createdAt.slice(0, 10),
      vendor: o.vendor,
      description: o.description ?? '',
      departmentName: o.departmentName ?? '',
      code: o.costCode ?? '',
      amount: o.amount,
      vatRate: o.vatRate ?? null,
      status: o.status,
      paid: Boolean(o.paidAt),
      actualAmount: o.actualAmount ?? null,
      rebateEligible: o.rebateEligible,
    })
    if (o.status === 'rejected') continue

    const key = o.costCodeId ?? 'none'
    const codeMeta = costCodes.find(c => c.id === o.costCodeId)
    const codeRow = codeMap.get(key) ?? {
      code: o.costCode ?? '',
      name: o.costCodeName ?? '',
      departmentName: codeMeta?.departmentName ?? '',
      budget: codeMeta?.budget ?? 0,
      committed: 0,
      paid: 0,
      vat: 0,
      rebate: 0,
      remaining: 0,
      pct: 0,
      count: 0,
    }
    codeMap.set(key, codeRow)

    const effective = o.actualAmount ?? o.amount
    const paid = o.paidAt ? effective : 0
    const vat = o.vatRate !== undefined ? vatPortion(effective, o.vatRate) : 0
    const rebate = o.rebateEligible ? effective : 0

    codeRow.committed += effective
    codeRow.paid += paid
    codeRow.vat += vat
    codeRow.rebate += rebate
    codeRow.count++

    const deptKey = o.departmentName ?? ''
    const dept = deptMap.get(deptKey) ?? { name: deptKey, committed: 0, paid: 0, count: 0 }
    dept.committed += effective
    dept.paid += paid
    dept.count++
    deptMap.set(deptKey, dept)

    grand.committed += effective
    grand.paid += paid
    grand.vat += vat
    grand.rebate += rebate
    grand.count++
  }

  const codeRows = [...codeMap.values()]
  for (const r of codeRows) {
    r.remaining = r.budget ? r.budget - r.committed : 0
    r.pct = r.budget ? Math.round((r.committed / r.budget) * 100) : 0
    grand.budget += r.budget
  }
  codeRows.sort((a, b) => (b.committed - a.committed) || a.code.localeCompare(b.code, undefined, { numeric: true }))

  return {
    codeRows,
    deptSubtotals: [...deptMap.values()].sort((a, b) => b.committed - a.committed),
    grand,
    orders: orderRows.sort((a, b) => b.poNumber - a.poNumber),
  }
}

export interface PoReportCsvLabels {
  title: string
  job: string
  company: string
  /** Extra scope line for department reports, empty for whole-job reports. */
  scope: string
  generated: string
  colCode: string
  colName: string
  colDept: string
  colBudget: string
  colCommitted: string
  colPaid: string
  colVat: string
  colRebate: string
  colRemaining: string
  colPct: string
  colCount: string
  grandTotal: string
  noCode: string
  ordersTitle: string
  colNo: string
  colDate: string
  colVendor: string
  colDescription: string
  colAmount: string
  colVatRate: string
  colStatus: string
  colPaidFlag: string
  colActual: string
  statusText: Record<'pending' | 'approved' | 'rejected', string>
  yes: string
  no: string
}

/**
 * One CSV field: quote when it contains the delimiter, quotes or newlines.
 * Text starting with a formula trigger is prefixed with an apostrophe so
 * Excel treats it as text instead of evaluating it (CSV injection).
 */
const csvField = (value: string | number): string => {
  let s = String(value).replace(/\r?\n/g, ' ')
  if (typeof value === 'string' && /^[=+\-@]/.test(s)) s = `'${s}`
  return /[;"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const csvLine = (...fields: (string | number)[]): string => fields.map(csvField).join(';')

/**
 * Excel-friendly CSV: UTF-8 BOM, semicolon-delimited (Icelandic Excel's list
 * separator), whole ISK integers without grouping, ISO dates.
 */
export function buildPoReportCsv(report: PoReport, labels: PoReportCsvLabels): string {
  const lines: string[] = []
  lines.push(csvLine(labels.title))
  lines.push(csvLine(labels.job))
  lines.push(csvLine(labels.company))
  if (labels.scope) lines.push(csvLine(labels.scope))
  lines.push(csvLine(labels.generated))
  lines.push('')

  lines.push(csvLine(
    labels.colCode, labels.colName, labels.colDept, labels.colCount, labels.colBudget,
    labels.colCommitted, labels.colPaid, labels.colVat, labels.colRebate, labels.colRemaining, labels.colPct,
  ))
  for (const r of report.codeRows) {
    lines.push(csvLine(
      r.code || labels.noCode, r.name, r.departmentName, r.count, r.budget || '',
      r.committed, r.paid, r.vat, r.rebate, r.budget ? r.remaining : '', r.budget ? r.pct : '',
    ))
  }
  const g = report.grand
  lines.push(csvLine(
    labels.grandTotal, '', '', g.count, g.budget || '', g.committed, g.paid, g.vat, g.rebate,
    g.budget ? g.budget - g.committed : '', g.budget ? Math.round((g.committed / g.budget) * 100) : '',
  ))
  lines.push('')

  lines.push(csvLine(labels.ordersTitle))
  lines.push(csvLine(
    labels.colNo, labels.colDate, labels.colVendor, labels.colDescription, labels.colDept,
    labels.colCode, labels.colAmount, labels.colVatRate, labels.colStatus, labels.colPaidFlag, labels.colActual, labels.colRebate,
  ))
  for (const o of report.orders) {
    lines.push(csvLine(
      `PO-${String(o.poNumber).padStart(3, '0')}`, o.dateIso, o.vendor, o.description, o.departmentName,
      o.code, o.amount, o.vatRate === null ? '' : o.vatRate, labels.statusText[o.status],
      o.paid ? labels.yes : labels.no, o.actualAmount ?? '', o.rebateEligible ? labels.yes : labels.no,
    ))
  }

  // Leading BOM so Excel opens the file as UTF-8 (explicit escape — an
  // invisible literal is too easy for an editor or formatter to strip).
  return String.fromCharCode(0xFEFF) + lines.join('\r\n')
}
