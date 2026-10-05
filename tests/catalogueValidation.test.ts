import { beforeAll, describe, expect, it } from 'vitest'
import { RESERVED_VEHICLE_SLUGS } from '../app/data/vehicleLandings'
import { RESERVED_EQUIPMENT_SLUGS } from '../app/data/equipmentLandings'

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
    expect(parseEquipmentPayload(equipmentBody())).not.toHaveProperty('slug')
    expect(parseEquipmentPayload(equipmentBody({ slug: 'My-Generator' })).slug).toBe('my-generator')
  })

  it('rejects malformed and reserved slugs', async () => {
    const { parseEquipmentPayload } = await import('../server/utils/equipmentStore')
    expect(() => parseEquipmentPayload(equipmentBody({ slug: 'has space' }))).toThrow()
    expect(() => parseEquipmentPayload(equipmentBody({ slug: RESERVED_EQUIPMENT_SLUGS[0] }))).toThrow()
  })

  it('stores description and highlights only when given', async () => {
    const { parseEquipmentPayload } = await import('../server/utils/equipmentStore')
    const bare = parseEquipmentPayload(equipmentBody({ description: { en: '', is: '' }, highlights: [{ en: '', is: '' }] }))
    expect(bare).not.toHaveProperty('description')
    expect(bare).not.toHaveProperty('highlights')
    const full = parseEquipmentPayload(equipmentBody({ description: { en: 'Para one.\n\nPara two.' }, highlights: [{ en: 'Quiet' }] }))
    expect(full.description?.en).toContain('Para two')
    expect(full.highlights).toHaveLength(1)
  })
})

describe('assertUniqueEquipmentSlug', () => {
  it('rejects two items resolving to the same URL, derived or explicit', async () => {
    const { assertUniqueEquipmentSlug } = await import('../server/utils/equipmentStore')
    const a = { id: 'e-1', name: { en: 'Cones', is: 'Keilur' }, tagline: { en: '', is: '' }, images: [], category: 'safety' as const }
    const b = { id: 'e-2', name: { en: 'Other', is: 'Annað' }, slug: 'keilur', tagline: { en: '', is: '' }, images: [], category: 'safety' as const }
    expect(() => assertUniqueEquipmentSlug(b, [a])).toThrow()
    expect(() => assertUniqueEquipmentSlug({ ...b, slug: 'annad' }, [a])).not.toThrow()
    expect(() => assertUniqueEquipmentSlug(a, [a])).not.toThrow()
  })
})
