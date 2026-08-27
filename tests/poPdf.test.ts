import { describe, expect, it } from 'vitest'
import type { PurchaseOrder } from '../app/types'
import { buildPoReport } from '../app/utils/poReport'
import { exportPoReportPdf } from '../app/utils/poReportPdf'
import { exportVendorPoPdf } from '../app/utils/poVendorPdf'

// Smoke tests: both PDF modules must render real input to a valid PDF without
// throwing. Catches label-interface drift and layout code that only breaks at
// render time (encoding, pagination, missing fields).

const order = (over: Partial<PurchaseOrder>): PurchaseOrder => ({
  id: 'po-x',
  jobId: 'j1',
  poNumber: 7,
  createdAt: '2026-08-26T10:00:00.000Z',
  vendor: 'Byko byggingavörur',
  amount: 124_000,
  status: 'approved',
  createdById: 'u1',
  createdByName: 'Jón Jónsson',
  rebateEligible: true,
  ...over,
})

const REPORT_LABELS = {
  title: 'Kostnaðarskýrsla',
  summary: 'Eftir lyklum',
  colCode: 'Lykill',
  colCount: 'Fjöldi',
  colCommitted: 'Skuldbundið',
  colPaid: 'Greitt',
  colBudget: 'Budget',
  byDept: 'Eftir deildum',
  grandTotal: 'Samtals',
  vatLine: 'VSK hluti',
  rebateLine: 'Endurgreiðsluhæft',
  noCode: 'Enginn lykill',
  noDept: 'Engin deild',
  noBudget: 'Ekkert budget',
  ordersTitle: 'Beiðnir',
  colNo: 'Nr',
  colDate: 'Dags',
  colVendor: 'Seljandi',
  colAmount: 'Upphæð',
  colStatus: 'Staða',
  statusText: { pending: 'Í bið', approved: 'Samþykkt', rejected: 'Hafnað' } as const,
  paidText: 'Greitt',
  continued: 'framhald',
}

describe('exportPoReportPdf', () => {
  it('renders a report with many orders to a valid multi-page PDF', async () => {
    const orders = Array.from({ length: 60 }, (_, i) => order({
      id: `po-${i}`,
      poNumber: i + 1,
      vendor: `Seljandi ${i} með langt nafn og íslenska stafi þæö`,
      description: 'Löng lýsing sem brotnar á milli lína í töflunni og heldur áfram og áfram',
      amount: 99_999_999,
      vatRate: 24,
      costCodeId: 'cc1',
      costCode: '4110',
      costCodeName: 'Leikmynd',
      departmentName: 'Camera',
      paidAt: i % 2 ? 'x' : undefined,
      actualAmount: i % 4 === 1 ? 95_000_000 : undefined,
      status: i % 7 === 0 ? 'rejected' : 'approved',
    }))
    const report = buildPoReport(orders, [
      { id: 'cc1', code: '4110', name: 'Leikmynd', budget: 500_000, departmentName: 'Camera' },
      { id: 'cc2', code: '4200', name: 'Leiga án beiðna' },
    ])
    const bytes = await exportPoReportPdf(report, {
      jobName: 'Stórmynd á Íslandi',
      companyName: 'Framleiðslufélagið ehf.',
      dateText: '26. ágú. 2026',
      scopeText: '',
    }, REPORT_LABELS)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-')
  })

  it('renders an empty report without throwing', async () => {
    const bytes = await exportPoReportPdf(buildPoReport([], []), {
      jobName: '',
      companyName: '',
      dateText: '',
      scopeText: 'Deild: Camera',
    }, REPORT_LABELS)
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-')
  })
})

describe('exportVendorPoPdf', () => {
  const labels = {
    title: 'Innkaupapöntun',
    date: 'Dags',
    job: 'Verk',
    vendor: 'Seljandi',
    description: 'Vegna',
    dept: 'Deild',
    code: 'Lykill',
    createdBy: 'Skráð af',
    net: 'Nettó',
    vat: 'VSK',
    total: 'Samtals',
    approvedBy: 'Samþykkt af',
    statusPending: 'Óstaðfest beiðni',
    statusRejected: 'Hafnað',
  }

  it('renders an approved order with VAT to a valid PDF', async () => {
    const bytes = await exportVendorPoPdf(order({
      vatRate: 24,
      description: 'Timbur, skrúfur og fleira í leikmyndina',
      costCode: '4110',
      costCodeName: 'Leikmynd',
      departmentName: 'Camera',
      decidedByName: 'Test Admin',
      decidedAt: '2026-08-26T11:00:00.000Z',
    }), {
      companyName: 'Framleiðslufélagið ehf.',
      jobName: 'Stórmynd á Íslandi',
      dateText: '26. ágú. 2026',
      decidedDateText: '26. ágú. 2026',
    }, labels)
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-')
  })

  it('renders a pending order with no optional fields without throwing', async () => {
    const bytes = await exportVendorPoPdf(order({ status: 'pending' }), {
      companyName: '',
      jobName: '',
      dateText: '',
      decidedDateText: '',
    }, labels)
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-')
  })
})
