import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { RESERVED_VEHICLE_SLUGS, landingForCategoryQuery, vehicleKinds, vehicleLandings } from '../app/data/vehicleLandings'
import { equipmentLandings, seedSlugOf } from '../app/data/equipmentLandings'
import { vehicles } from '../app/data/vehicles'
import { equipment } from '../app/data/equipment'
import { equipmentSlug } from '../app/utils/equipmentSlug'

const locale = (code: 'is' | 'en') =>
  JSON.parse(readFileSync(new URL(`../i18n/locales/${code}.json`, import.meta.url), 'utf8'))

const get = (obj: any, path: string) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)

describe('vehicle landing pages', () => {
  it('never share a path segment with a seed vehicle slug', () => {
    for (const v of vehicles) expect(RESERVED_VEHICLE_SLUGS, v.slug).not.toContain(v.slug)
  })

  it('have unique paths per locale and unique route names', () => {
    for (const code of ['is', 'en'] as const) {
      const paths = vehicleLandings.map(l => l.paths[code])
      expect(new Set(paths).size).toBe(paths.length)
    }
    const names = vehicleLandings.map(l => l.routeName)
    expect(new Set(names).size).toBe(names.length)
  })

  it('match their page files (Icelandic path = file name, route name = folder-file)', () => {
    for (const l of vehicleLandings) {
      const [, folder, file] = l.paths.is.split('/')
      expect(l.routeName).toBe(`${folder}-${file}`)
      expect(() => readFileSync(new URL(`../app/pages/${folder}/${file}.vue`, import.meta.url))).not.toThrow()
    }
  })

  it('cover every vehicle kind except pickups, and every ?category= value', () => {
    const kinds = new Set(vehicleLandings.map(l => l.kind))
    for (const kind of vehicleKinds.filter(k => k !== 'pickup')) expect(kinds.has(kind), kind).toBe(true)
    for (const category of ['campers', 'equipment-cars', 'support-vehicles', 'trailers'] as const) {
      expect(landingForCategoryQuery[category]).toBeDefined()
    }
  })

  it('every seed vehicle with a landing kind is on exactly one landing', () => {
    for (const v of vehicles) {
      if (!v.kind || v.kind === 'pickup') continue
      expect(vehicleLandings.filter(l => l.kind === v.kind)).toHaveLength(1)
    }
  })
})

describe('equipment category seeds', () => {
  const seedSlugs = equipmentLandings.flatMap(l => [seedSlugOf(l, 'is'), seedSlugOf(l, 'en')])

  it('never share a path segment with a seed equipment item', () => {
    for (const e of equipment) expect(seedSlugs, e.id).not.toContain(equipmentSlug(e))
  })

  it('have unique slugs across both locales and unique ids', () => {
    expect(new Set(seedSlugs).size).toBe(seedSlugs.length)
    const ids = equipmentLandings.map(l => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every seed equipment item belongs to a seeded category', () => {
    const ids = new Set(equipmentLandings.map(l => l.id))
    for (const e of equipment) expect(ids.has(e.category), e.id).toBe(true)
  })
})

describe('landing copy', () => {
  it('is complete in both locales', () => {
    const required = ['kicker', 'title', 'intro1', 'metaTitle', 'metaDescription']
    for (const code of ['is', 'en'] as const) {
      const messages = locale(code)
      for (const l of vehicleLandings) {
        for (const field of required) {
          expect(typeof get(messages, `${l.key}.${field}`), `${code} ${l.key}.${field}`).toBe('string')
        }
      }
      // Equipment copy is only read once, to seed the database, but it must exist for that seed.
      for (const l of equipmentLandings) {
        for (const field of ['title', 'intro1', 'metaTitle', 'metaDescription']) {
          expect(typeof get(messages, `${l.key}.${field}`), `${code} ${l.key}.${field}`).toBe('string')
        }
        expect(typeof get(messages, `equipmentCategories.${l.id}`), `${code} equipmentCategories.${l.id}`).toBe('string')
      }
      for (const key of ['faq.title', 'faq.kicker', 'nav.crewLogin', 'breadcrumbs.label']) {
        expect(typeof get(messages, key), `${code} ${key}`).toBe('string')
      }
      expect(Array.isArray(get(messages, 'faq.home'))).toBe(true)
    }
  })
})
