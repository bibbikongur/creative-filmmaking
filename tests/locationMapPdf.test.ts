import { describe, expect, it } from 'vitest'
import type { LocationMapMarker, LocationMapPage } from '~~/app/types'
import { buildIndexRows, type ExportLabels } from '~~/app/utils/locationMapPdf'

const labels: ExportLabels = {
  locationsTitle: 'Staðsetningar',
  locationName: n => `Location ${n}`,
  kindName: kind => ({ basecamp: 'Basecamp', set: 'Tökustaður', parking: 'Bílastæði', trucks: 'Tækjabílar', catering: 'Veitingar', wc: 'Salerni', custom: 'Annað' }[kind]!),
}

const marker = (kind: LocationMapMarker['kind'], extra: Partial<LocationMapMarker> = {}): LocationMapMarker =>
  ({ id: `m-${Math.random().toString(36).slice(2, 8)}`, kind, lat: 64, lng: -21, ...extra })

const pageWith = (markers: LocationMapMarker[]): LocationMapPage =>
  ({ id: 'p', title: '', base: 'streets', center: { lat: 64, lng: -21 }, zoom: 13, markers, roads: [], texts: [], vehicles: [] })

describe('buildIndexRows', () => {
  it('keeps the location block unbroken and numbered, other pins after', () => {
    // Placement order deliberately interleaved.
    const rows = buildIndexRows(pageWith([
      marker('set', { num: 2 }),
      marker('basecamp'),
      marker('set', { num: 1, label: 'Svarta fjaran' }),
      marker('parking'),
      marker('set', { num: 3 }),
      marker('parking'),
    ]), labels)
    expect(rows.map(r => r.name)).toEqual([
      '1 · SVARTA FJARAN',
      'LOCATION 2',
      'LOCATION 3',
      'BASECAMP',
      'BÍLASTÆÐI 1',
      'BÍLASTÆÐI 2',
    ])
  })

  it('names a single unlabeled pin without a counter', () => {
    const rows = buildIndexRows(pageWith([marker('basecamp'), marker('catering')]), labels)
    expect(rows.map(r => r.name)).toEqual(['BASECAMP', 'VEITINGAR'])
  })
})
