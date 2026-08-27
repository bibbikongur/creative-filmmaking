import { beforeAll, describe, expect, it } from 'vitest'

beforeAll(() => {
  (globalThis as any).useRuntimeConfig = () => ({});
  (globalThis as any).createError = (opts: any) => Object.assign(new Error(opts.statusMessage), opts)
})

describe('validateFields', () => {
  const valid = { id: 'f-1', type: 'name', page: 1, x: 100, y: 200.123, w: 160, h: 18 }

  it('accepts a valid field list, rounds coordinates and keeps ids', async () => {
    const { validateFields } = await import('../server/utils/docTemplateStore')
    const [f] = validateFields([valid])
    expect(f).toMatchObject({ id: 'f-1', type: 'name', page: 1, x: 100, y: 200.12, w: 160, h: 18 })
  })

  it('generates an id when missing', async () => {
    const { validateFields } = await import('../server/utils/docTemplateStore')
    const [f] = validateFields([{ ...valid, id: undefined }])
    expect(f!.id).toMatch(/^f-/)
  })

  it('accepts an empty list', async () => {
    const { validateFields } = await import('../server/utils/docTemplateStore')
    expect(validateFields([])).toEqual([])
  })

  it('rejects non-arrays and oversized lists', async () => {
    const { validateFields } = await import('../server/utils/docTemplateStore')
    expect(() => validateFields('nope')).toThrow()
    expect(() => validateFields(Array.from({ length: 101 }, () => ({ ...valid })))).toThrow()
  })

  it('rejects bad types, pages and coordinates', async () => {
    const { validateFields } = await import('../server/utils/docTemplateStore')
    expect(() => validateFields([{ ...valid, type: 'ssn' }])).toThrow()
    expect(() => validateFields([{ ...valid, page: 0 }])).toThrow()
    expect(() => validateFields([{ ...valid, page: 1.5 }])).toThrow()
    expect(() => validateFields([{ ...valid, x: -1 }])).toThrow()
    expect(() => validateFields([{ ...valid, y: Number.NaN }])).toThrow()
    expect(() => validateFields([{ ...valid, w: 999999 }])).toThrow()
  })
})
