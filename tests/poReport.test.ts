import { describe, expect, it } from 'vitest'
import type { PurchaseOrder, PurchaseOrderCostCode } from '../app/types'
import { buildPoReport, buildPoReportCsv, vatPortion } from '../app/utils/poReport'

const order = (over: Partial<PurchaseOrder>): PurchaseOrder => ({
  id: 'po-x',
  jobId: 'j1',
  poNumber: 1,
  createdAt: '2026-08-26T10:00:00.000Z',
  vendor: 'Byko',
  amount: 100_000,
  status: 'approved',
  createdById: 'u1',
  createdByName: 'Jon',
  rebateEligible: false,
  ...over,
})

const CSV_LABELS = {
  title: 'Kostnadarskyrsla',
  job: 'Verk: Test',
  company: 'Felag',
  scope: '',
  generated: 'Buid til 26.8.2026',
  colCode: 'Lykill',
  colName: 'Heiti',
  colDept: 'Deild',
  colBudget: 'Budget',
  colCommitted: 'Skuldbundid',
  colPaid: 'Greitt',
  colVat: 'VSK',
  colRebate: 'Endurgr.',
  colRemaining: 'Eftirstodvar',
  colPct: 'Nyting',
  colCount: 'Fjoldi',
  grandTotal: 'Samtals',
  noCode: 'Enginn lykill',
  ordersTitle: 'Beidnir',
  colNo: 'Nr',
  colDate: 'Dags',
  colVendor: 'Seljandi',
  colDescription: 'Lysing',
  colAmount: 'Upphaed',
  colVatRate: 'VSK%',
  colStatus: 'Stada',
  colPaidFlag: 'Greitt',
  colActual: 'Raun',
  statusText: { pending: 'I bid', approved: 'Samthykkt', rejected: 'Hafnad' } as const,
  yes: 'Ja',
  no: 'Nei',
}

describe('vatPortion', () => {
  it('splits gross so net + vat always equals the amount', () => {
    for (const [amount, rate] of [[124_000, 24], [111_000, 11], [999, 24], [1, 24]] as const) {
      const vat = vatPortion(amount, rate)
      const net = amount - vat
      expect(net + vat).toBe(amount)
      expect(net).toBe(Math.round(amount / (1 + rate / 100)))
    }
    expect(vatPortion(124_000, 24)).toBe(24_000)
  })

  it('returns 0 for rate 0 or missing', () => {
    expect(vatPortion(100_000, 0)).toBe(0)
    expect(vatPortion(100_000, undefined)).toBe(0)
  })
})

describe('buildPoReport', () => {
  const codes: PurchaseOrderCostCode[] = [
    { id: 'cc1', code: '4110', name: 'Leikmynd', budget: 500_000, departmentId: 'd1', departmentName: 'Camera' },
    { id: 'cc2', code: '4200', name: 'Leiga', budget: 200_000, departmentId: 'd1', departmentName: 'Camera' },
  ]

  it('aggregates committed, paid and budgets per code with the actual amount superseding the estimate', () => {
    const report = buildPoReport([
      order({ id: 'a', poNumber: 1, costCodeId: 'cc1', costCode: '4110', costCodeName: 'Leikmynd', amount: 100_000, paidAt: 'x', actualAmount: 90_000 }),
      order({ id: 'b', poNumber: 2, costCodeId: 'cc1', costCode: '4110', costCodeName: 'Leikmynd', amount: 50_000, status: 'pending' }),
      order({ id: 'c', poNumber: 3, amount: 30_000 }),
    ], codes)

    const cc1 = report.codeRows.find(r => r.code === '4110')!
    // The recorded actual (90k) replaces the 100k estimate in committed too.
    expect(cc1.committed).toBe(140_000)
    expect(cc1.paid).toBe(90_000)
    expect(cc1.remaining).toBe(360_000)
    expect(cc1.pct).toBe(28)
    expect(cc1.count).toBe(2)

    // Budgeted code with no orders still gets a row; the code-less bucket too.
    expect(report.codeRows.find(r => r.code === '4200')!.committed).toBe(0)
    expect(report.codeRows.find(r => r.code === '')!.committed).toBe(30_000)

    // Department flows from the code register onto every row shape.
    expect(report.codeRows.find(r => r.code === '4110')!.departmentName).toBe('Camera')
    expect(report.codeRows.find(r => r.code === '4200')!.departmentName).toBe('Camera')

    expect(report.grand.committed).toBe(170_000)
    expect(report.grand.paid).toBe(90_000)
    expect(report.grand.budget).toBe(700_000)
  })

  it('excludes rejected orders from money but lists them', () => {
    const report = buildPoReport([
      order({ id: 'a', poNumber: 1, amount: 100_000, status: 'rejected' }),
      order({ id: 'b', poNumber: 2, amount: 40_000 }),
    ], [])
    expect(report.grand.committed).toBe(40_000)
    expect(report.grand.count).toBe(1)
    expect(report.orders).toHaveLength(2)
    expect(report.orders.find(o => o.poNumber === 1)!.status).toBe('rejected')
  })

  it('sums VAT and rebate over non-rejected orders and builds dept subtotals', () => {
    const report = buildPoReport([
      order({ id: 'a', poNumber: 1, amount: 124_000, vatRate: 24, rebateEligible: true, departmentName: 'Camera' }),
      order({ id: 'b', poNumber: 2, amount: 50_000, vatRate: 0, departmentName: 'Grip' }),
      order({ id: 'c', poNumber: 3, amount: 99_000, vatRate: 24, status: 'rejected', rebateEligible: true }),
    ], [])
    expect(report.grand.vat).toBe(24_000)
    expect(report.grand.rebate).toBe(124_000)
    expect(report.deptSubtotals.map(d => d.name)).toEqual(['Camera', 'Grip'])
  })
})

describe('buildPoReportCsv', () => {
  it('starts with a BOM and uses semicolons and CRLF', () => {
    const csv = buildPoReportCsv(buildPoReport([order({})], []), CSV_LABELS)
    expect(csv.charCodeAt(0)).toBe(0xFEFF)
    expect(csv).toContain('\r\n')
    expect(csv).toContain('Lykill;Heiti;Deild')
  })

  it('neutralizes Excel formula triggers at the start of text fields', () => {
    const csv = buildPoReportCsv(buildPoReport([
      order({ vendor: '=cmd|calc', description: '+SUM(A1)' }),
    ], []), CSV_LABELS)
    expect(csv).toContain('\'=cmd|calc')
    expect(csv).toContain('\'+SUM(A1)')
    // Numeric fields stay raw so Excel still parses them as numbers.
    expect(csv).toContain(';100000;')
  })

  it('leaves remaining and pct empty for codes and totals without a budget', () => {
    const csv = buildPoReportCsv(buildPoReport([order({})], []), CSV_LABELS)
    const summaryRow = csv.split('\r\n').find(l => l.startsWith('Enginn lykill'))!
    expect(summaryRow.endsWith(';;')).toBe(true)
  })

  it('escapes fields containing the delimiter, quotes or newlines', () => {
    const csv = buildPoReportCsv(buildPoReport([
      order({ vendor: 'A;B', description: 'Say "hi"\nline two' }),
    ], []), CSV_LABELS)
    expect(csv).toContain('"A;B"')
    expect(csv).toContain('"Say ""hi"" line two"')
  })

  it('writes actual amount and paid flag on paid orders', () => {
    const csv = buildPoReportCsv(buildPoReport([
      order({ paidAt: 'x', actualAmount: 90_000, amount: 100_000 }),
    ], []), CSV_LABELS)
    expect(csv).toContain(';Ja;90000;')
  })
})
