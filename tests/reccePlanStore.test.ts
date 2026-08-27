import { beforeAll, describe, expect, it } from 'vitest'

beforeAll(() => {
  (globalThis as any).createError = (opts: any) => Object.assign(new Error(opts.statusMessage), opts)
})

const load = () => import('../server/utils/reccePlanStore')

const TINY_JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

describe('validatePlanName', () => {
  it('trims and requires a name', async () => {
    const { validatePlanName } = await load()
    expect(validatePlanName('  Katana  ')).toBe('Katana')
    expect(() => validatePlanName('')).toThrow()
    expect(() => validatePlanName('   ')).toThrow()
    expect(() => validatePlanName(42)).toThrow()
  })

  it('caps the length at 120', async () => {
    const { validatePlanName } = await load()
    expect(validatePlanName('x'.repeat(300))).toHaveLength(120)
  })
})

describe('validatePlanData', () => {
  it('normalizes a full plan and keeps valid photos', async () => {
    const { validatePlanData } = await load()
    const data = validatePlanData({
      subtitle: ' Tech recce ',
      date: '2026-08-27',
      startTime: '08:00',
      note: 'Mæting',
      stops: [{
        name: ' Þingvellir ',
        address: 'Þingvallavegur',
        notes: 'Skoða gjána',
        link: 'https://maps.app.goo.gl/x',
        coords: '64.25, -21.13',
        photos: [TINY_JPEG],
        durationMin: 60.7,
        travelMin: -5,
      }],
      contacts: [{ name: 'Jóna', role: 'LM', phone: '555' }],
    })
    expect(data.subtitle).toBe('Tech recce')
    expect(data.stops[0]!.name).toBe('Þingvellir')
    expect(data.stops[0]!.durationMin).toBe(61)
    expect(data.stops[0]!.travelMin).toBe(0)
    expect(data.stops[0]!.photos).toEqual([TINY_JPEG])
    expect(data.contacts).toHaveLength(1)
  })

  it('round-trips the coordsAuto flag and drops falsy values', async () => {
    const { validatePlanData } = await load()
    const auto = validatePlanData({ stops: [{ coords: '64.2, -21.1', coordsAuto: true }] })
    expect(auto.stops[0]!.coordsAuto).toBe(true)
    const manual = validatePlanData({ stops: [{ coords: '64.2, -21.1', coordsAuto: false }] })
    expect(manual.stops[0]).not.toHaveProperty('coordsAuto')
  })

  it('defaults missing fields on an empty payload', async () => {
    const { validatePlanData } = await load()
    const data = validatePlanData({})
    expect(data).toEqual({ subtitle: '', date: '', startTime: '', note: '', stops: [], contacts: [] })
  })

  it('rejects bad dates, times, photos and oversized lists', async () => {
    const { validatePlanData } = await load()
    expect(validatePlanData({ date: 'yesterday', startTime: '25h' }).date).toBe('')
    expect(validatePlanData({ startTime: 'nope' }).startTime).toBe('')
    expect(() => validatePlanData({ stops: [{ photos: ['data:image/png;base64,xx'] }] })).toThrow()
    expect(() => validatePlanData({ stops: [{ photos: [1, 2, 3] }] })).toThrow()
    expect(() => validatePlanData({ stops: Array.from({ length: 61 }, () => ({})) })).toThrow()
    expect(() => validatePlanData({ contacts: Array.from({ length: 31 }, () => ({})) })).toThrow()
  })

  it('emptyPlanData starts with one blank stop and defaults', async () => {
    const { emptyPlanData, validatePlanData } = await load()
    const data = emptyPlanData()
    expect(data.startTime).toBe('08:00')
    expect(data.stops).toHaveLength(1)
    // The defaults must round-trip through the validator unchanged.
    expect(validatePlanData(data)).toEqual(data)
  })
})
