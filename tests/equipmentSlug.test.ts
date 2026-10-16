import { describe, expect, it } from 'vitest'
import { derivedEquipmentSlug, equipmentSlug, isReservedEquipmentSlug, slugify } from '../app/utils/equipmentSlug'
import { RESERVED_EQUIPMENT_SLUGS } from '../app/data/equipmentLandings'

const item = (over: Partial<{ id: string, slug: string, name: { en: string, is: string } }> = {}) => ({
  id: 'e-test',
  name: { en: 'Inverter Generator 2.2 kVA', is: 'Rafstöð 2,2 kVA' },
  ...over,
})

describe('slugify', () => {
  it('transliterates Icelandic and collapses punctuation', () => {
    expect(slugify('Rafstöð 2,2 kVA 230V (CGM CG2200I)')).toBe('rafstod-2-2-kva-230v-cgm-cg2200i')
    expect(slugify('Þrif & Ýmislegt')).toBe('thrif-ymislegt')
  })
})

describe('equipmentSlug', () => {
  it('prefers a stored slug over the derived one', () => {
    expect(equipmentSlug(item({ slug: 'my-generator' }))).toBe('my-generator')
    expect(derivedEquipmentSlug(item())).toBe('rafstod-2-2-kva')
  })

  it('derives from the Icelandic name, then English, then the id', () => {
    expect(equipmentSlug(item())).toBe('rafstod-2-2-kva')
    expect(equipmentSlug(item({ name: { en: 'Only English', is: '' } }))).toBe('only-english')
    expect(equipmentSlug(item({ name: { en: '', is: '' } }))).toBe('e-test')
  })

  it('suffixes the id when a derived slug collides with a landing page', () => {
    const reserved = RESERVED_EQUIPMENT_SLUGS[0]!
    expect(isReservedEquipmentSlug(reserved)).toBe(true)
    expect(equipmentSlug(item({ name: { en: '', is: reserved } }))).toBe(`${reserved}-e-test`)
  })
})
