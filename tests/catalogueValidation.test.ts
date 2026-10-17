import { beforeAll, describe, expect, it } from 'vitest'
import { RESERVED_VEHICLE_SLUGS } from '../app/data/vehicleLandings'
import type { EquipmentCategoryDef } from '../app/types'

beforeAll(() => {
  (globalThis as any).createError = (opts: any) => Object.assign(new Error(opts.statusMessage), opts)
})

const vehicleBody = (over: Record<string, unknown> = {}) => ({
  slug: 'test-truck',
  category: 'equipment-cars',
  name: { en: 'Test Truck' },
  tagline: { en: 'A truck' },
  images: ['/images/x.jpg'],
  ...over,
})

const equipmentBody = (over: Record<string, unknown> = {}) => ({
  category: 'power',
  name: { en: 'Test Generator', is: 'Prófunarrafstöð' },
  images: ['/images/x.jpg'],
  ...over,
})

const CATEGORY_IDS = ['heating', 'power']

const category = (over: Partial<EquipmentCategoryDef> = {}): EquipmentCategoryDef => ({
  id: 'heating',
  sort: 0,
  status: 'active',
  slug: { is: 'hitablasarar', en: 'heaters' },
  name: { is: 'Hiti', en: 'Heating' },
  title: { is: 'Hitablásarar til leigu', en: 'Heaters for rent' },
  metaTitle: { is: '', en: '' },
  metaDescription: { is: '', en: '' },
  intro: [],
  faq: [],
  previousSlugs: ['hitarar'],
  ...over,
})

describe('parseVehiclePayload', () => {
  it('rejects slugs taken by a category landing page', async () => {
    const { parseVehiclePayload } = await import('../server/utils/vehicleStore')
    const reserved = RESERVED_VEHICLE_SLUGS[0]!
    expect(() => parseVehiclePayload(vehicleBody({ slug: reserved }))).toThrow()
    expect(parseVehiclePayload(vehicleBody()).slug).toBe('test-truck')
  })

  it('keeps a valid kind and drops unknown ones', async () => {
    const { parseVehiclePayload } = await import('../server/utils/vehicleStore')
    expect(parseVehiclePayload(vehicleBody({ kind: 'box-truck' })).kind).toBe('box-truck')
    expect(parseVehiclePayload(vehicleBody({ kind: 'spaceship' }))).not.toHaveProperty('kind')
  })
})

describe('parseEquipmentPayload', () => {
  it('accepts an empty slug (derived later) and a valid explicit one', async () => {
    const { parseEquipmentPayload } = await import('../server/utils/equipmentStore')
    expect(parseEquipmentPayload(equipmentBody(), CATEGORY_IDS)).not.toHaveProperty('slug')
    expect(parseEquipmentPayload(equipmentBody({ slug: 'My-Generator' }), CATEGORY_IDS).slug).toBe('my-generator')
  })

  it('rejects malformed slugs and unknown categories', async () => {
    const { parseEquipmentPayload } = await import('../server/utils/equipmentStore')
    expect(() => parseEquipmentPayload(equipmentBody({ slug: 'has space' }), CATEGORY_IDS)).toThrow()
    expect(() => parseEquipmentPayload(equipmentBody({ category: 'spaceships' }), CATEGORY_IDS)).toThrow()
    expect(() => parseEquipmentPayload(equipmentBody({ category: 'power' }), ['heating'])).toThrow()
  })

  it('stores description and highlights only when given', async () => {
    const { parseEquipmentPayload } = await import('../server/utils/equipmentStore')
    const bare = parseEquipmentPayload(equipmentBody({ description: { en: '', is: '' }, highlights: [{ en: '', is: '' }] }), CATEGORY_IDS)
    expect(bare).not.toHaveProperty('description')
    expect(bare).not.toHaveProperty('highlights')
    const full = parseEquipmentPayload(equipmentBody({ description: { en: 'Para one.\n\nPara two.' }, highlights: [{ en: 'Quiet' }] }), CATEGORY_IDS)
    expect(full.description?.en).toContain('Para two')
    expect(full.highlights).toHaveLength(1)
  })
})

describe('assertUniqueEquipmentSlug', () => {
  const a = { id: 'e-1', name: { en: 'Cones', is: 'Keilur' }, tagline: { en: '', is: '' }, images: [], category: 'safety' }
  const b = { id: 'e-2', name: { en: 'Other', is: 'Annað' }, slug: 'keilur', tagline: { en: '', is: '' }, images: [], category: 'safety' }

  it('rejects two items resolving to the same URL, derived or explicit', async () => {
    const { assertUniqueEquipmentSlug } = await import('../server/utils/equipmentStore')
    expect(() => assertUniqueEquipmentSlug(b, [a])).toThrow()
    expect(() => assertUniqueEquipmentSlug({ ...b, slug: 'annad' }, [a])).not.toThrow()
    expect(() => assertUniqueEquipmentSlug(a, [a])).not.toThrow()
  })

  it('rejects an item slug equal to a category address, current or former', async () => {
    const { assertUniqueEquipmentSlug } = await import('../server/utils/equipmentStore')
    const cats = [category()]
    expect(() => assertUniqueEquipmentSlug({ ...b, slug: 'hitablasarar' }, [], cats)).toThrow()
    expect(() => assertUniqueEquipmentSlug({ ...b, slug: 'heaters' }, [], cats)).toThrow()
    expect(() => assertUniqueEquipmentSlug({ ...b, slug: 'hitarar' }, [], cats)).toThrow()
    expect(() => assertUniqueEquipmentSlug({ ...b, slug: 'annad' }, [], cats)).not.toThrow()
  })
})

describe('parseEquipmentCategoryPayload', () => {
  const body = (over: Record<string, unknown> = {}) => ({
    name: { is: 'Rafstöðvar', en: 'Generators' },
    ...over,
  })

  it('requires both names and derives slugs from them', async () => {
    const { parseEquipmentCategoryPayload } = await import('../server/utils/equipmentCategoryStore')
    const c = parseEquipmentCategoryPayload(body())
    expect(c.slug).toEqual({ is: 'rafstodvar', en: 'generators' })
    expect(c.title).toEqual({ is: 'Rafstöðvar', en: 'Generators' })
    expect(c.status).toBe('active')
    expect(() => parseEquipmentCategoryPayload(body({ name: { is: 'Rafstöðvar', en: '' } }))).toThrow()
    expect(() => parseEquipmentCategoryPayload(body({ slug: { is: 'has space', en: 'ok' } }))).toThrow()
  })

  it('splits intro paragraphs on blank lines and keeps only complete FAQ pairs', async () => {
    const { parseEquipmentCategoryPayload } = await import('../server/utils/equipmentCategoryStore')
    const c = parseEquipmentCategoryPayload(body({
      intro: { is: 'Fyrsta.\n\nÖnnur.', en: 'First.' },
      faq: [{ q: { is: 'Sp?', en: 'Q?' }, a: { is: 'Svar', en: 'A' } }, { q: { is: 'Tóm', en: '' }, a: { is: '', en: '' } }],
    }))
    expect(c.intro).toEqual([{ is: 'Fyrsta.', en: 'First.' }, { is: 'Önnur.', en: '' }])
    expect(c.faq).toHaveLength(1)
  })

  it('records a changed slug in the redirect history and never the current one', async () => {
    const { parseEquipmentCategoryPayload } = await import('../server/utils/equipmentCategoryStore')
    const c = parseEquipmentCategoryPayload(body({ slug: { is: 'hitun', en: 'heating-units' } }), category())
    expect(c.slug).toEqual({ is: 'hitun', en: 'heating-units' })
    expect(c.previousSlugs.sort()).toEqual(['heaters', 'hitablasarar', 'hitarar'])
    const back = parseEquipmentCategoryPayload(body({ slug: { is: 'hitarar', en: 'heaters' } }), category())
    expect(back.previousSlugs).toEqual(['hitablasarar'])
  })
})

describe('assertUniqueCategorySlugs', () => {
  it('rejects a slug used by another category (current or former) or by an item', async () => {
    const { assertUniqueCategorySlugs } = await import('../server/utils/equipmentCategoryStore')
    const other = category()
    const item = { id: 'e-1', name: { en: 'Cones', is: 'Keilur' }, slug: 'keilur', tagline: { en: '', is: '' }, images: [], category: 'safety' }
    const mine = (slug: { is: string, en: string }) => ({ id: 'c-new', slug, previousSlugs: [] })
    expect(() => assertUniqueCategorySlugs(mine({ is: 'hitablasarar', en: 'x' }), [other], [item])).toThrow()
    expect(() => assertUniqueCategorySlugs(mine({ is: 'x', en: 'hitarar' }), [other], [item])).toThrow()
    expect(() => assertUniqueCategorySlugs(mine({ is: 'keilur', en: 'cones' }), [other], [item])).toThrow()
    expect(() => assertUniqueCategorySlugs(mine({ is: 'x', en: 'y' }), [other], [item])).not.toThrow()
    // Editing a category against itself is fine
    expect(() => assertUniqueCategorySlugs(other, [other], [item])).not.toThrow()
  })
})
