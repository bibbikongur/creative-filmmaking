import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { RESERVED_VEHICLE_SLUGS, landingForCategoryQuery, vehicleKinds, vehicleLandings } from '../app/data/vehicleLandings'
import { RESERVED_EQUIPMENT_SLUGS, equipmentLandings } from '../app/data/equipmentLandings'
import { vehicles } from '../app/data/vehicles'
import { equipment } from '../app/data/equipment'
import { equipmentSlug } from '../app/utils/equipmentSlug'

const locale = (code: 'is' | 'en') =>
  JSON.parse(readFileSync(new URL(`../i18n/locales/${code}.json`, import.meta.url), 'utf8'))

const get = (obj: any, path: string) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)

describe('category landing pages', () => {
  it('never share a path segment with a seed vehicle or equipment slug', () => {
    for (const v of vehicles) expect(RESERVED_VEHICLE_SLUGS, v.slug).not.toContain(v.slug)
    for (const e of equipment) expect(RESERVED_EQUIPMENT_SLUGS, e.id).not.toContain(equipmentSlug(e))
  })

  it('have unique paths per locale and unique route names', () => {
    for (const code of ['is', 'en'] as const) {
      const paths = [...vehicleLandings, ...equipmentLandings].map(l => l.paths[code])
      expect(new Set(paths).size).toBe(paths.length)
    }
    const names = [...vehicleLandings, ...equipmentLandings].map(l => l.routeName)
    expect(new Set(names).size).toBe(names.length)
  })

  it('match their page files (Icelandic path = file name, route name = folder-file)', () => {
    for (const l of [...vehicleLandings, ...equipmentLandings]) {
      const [, folder, file] = l.paths.is.split('/')
      expect(l.routeName).toBe(`${folder}-${file}`)
      expect(() => readFileSync(new URL(`../app/pages/${folder}/${file}.vue`, import.meta.url))).not.toThrow()
    }
  })

  it('have complete copy in both locales', () => {
    const required = ['kicker', 'title', 'intro1', 'metaTitle', 'metaDescription']
    for (const code of ['is', 'en'] as const) {
      const messages = locale(code)
      for (const l of [...vehicleLandings, ...equipmentLandings]) {
        for (const field of required) {
          expect(typeof get(messages, `${l.key}.${field}`), `${code} ${l.key}.${field}`).toBe('string')
        }
      }
      for (const key of ['faq.title', 'faq.kicker', 'nav.crewLogin', 'breadcrumbs.label']) {
        expect(typeof get(messages, key), `${code} ${key}`).toBe('string')
      }
      expect(Array.isArray(get(messages, 'faq.home'))).toBe(true)
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
