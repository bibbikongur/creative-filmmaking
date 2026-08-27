import { beforeAll, describe, expect, it } from 'vitest'

beforeAll(() => {
  (globalThis as any).useRuntimeConfig = () => ({});
  (globalThis as any).createError = (opts: any) => Object.assign(new Error(opts.statusMessage), opts)
})

const validPage = {
  id: 'p-1',
  title: 'Basecamp',
  base: 'streets',
  center: { lat: 64.14, lng: -21.9 },
  zoom: 13,
  markers: [{ id: 'm-1', kind: 'basecamp', lat: 64.141, lng: -21.91, label: 'Basecamp A' }],
  roads: [{ id: 'r-1', points: [{ lat: 64.14, lng: -21.9 }, { lat: 64.15, lng: -21.92 }], color: '#facc15', width: 4, dashed: true }],
  texts: [{ id: 't-1', lat: 64.142, lng: -21.89, text: 'Inngangur hér', size: 14 }],
}

const tinyJpeg = `data:image/jpeg;base64,${'a'.repeat(64)}`

describe('validateMapName', () => {
  it('trims and accepts a normal name', async () => {
    const { validateMapName } = await import('../server/utils/locationMapStore')
    expect(validateMapName('  Dagur 3 - Þingvellir ')).toBe('Dagur 3 - Þingvellir')
  })

  it('rejects empty and non-string names', async () => {
    const { validateMapName } = await import('../server/utils/locationMapStore')
    expect(() => validateMapName('')).toThrow()
    expect(() => validateMapName('   ')).toThrow()
    expect(() => validateMapName(42)).toThrow()
  })

  it('caps the length at 120 chars', async () => {
    const { validateMapName } = await import('../server/utils/locationMapStore')
    expect(validateMapName('x'.repeat(500))).toHaveLength(120)
  })
})

describe('validatePages', () => {
  it('accepts a valid page and keeps its content', async () => {
    const { validatePages } = await import('../server/utils/locationMapStore')
    const [p] = validatePages([validPage])
    expect(p).toMatchObject({
      id: 'p-1',
      base: 'streets',
      zoom: 13,
      markers: [{ kind: 'basecamp', label: 'Basecamp A' }],
      roads: [{ color: '#facc15', width: 4, dashed: true }],
      texts: [{ text: 'Inngangur hér', size: 14 }],
    })
  })

  it('generates ids when missing', async () => {
    const { validatePages } = await import('../server/utils/locationMapStore')
    const [p] = validatePages([{ ...validPage, id: undefined, markers: [{ kind: 'set', lat: 1, lng: 2 }] }])
    expect(p!.id).toMatch(/^p-/)
    expect(p!.markers[0]!.id).toMatch(/^m-/)
  })

  it('rejects empty, non-array and oversized page lists', async () => {
    const { validatePages } = await import('../server/utils/locationMapStore')
    expect(() => validatePages([])).toThrow()
    expect(() => validatePages('nope')).toThrow()
    expect(() => validatePages(Array.from({ length: 21 }, () => ({ ...validPage })))).toThrow()
  })

  it('rejects bad bases, marker kinds, colors and coordinates', async () => {
    const { validatePages } = await import('../server/utils/locationMapStore')
    expect(() => validatePages([{ ...validPage, base: 'mars' }])).toThrow()
    expect(() => validatePages([{ ...validPage, markers: [{ kind: 'ufo', lat: 1, lng: 2 }] }])).toThrow()
    expect(() => validatePages([{ ...validPage, roads: [{ points: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }], color: 'red', width: 4 }] }])).toThrow()
    expect(() => validatePages([{ ...validPage, markers: [{ kind: 'set', lat: Number.NaN, lng: 2 }] }])).toThrow()
  })

  it('rejects single-point roads and empty text boxes', async () => {
    const { validatePages } = await import('../server/utils/locationMapStore')
    expect(() => validatePages([{ ...validPage, roads: [{ points: [{ lat: 1, lng: 2 }], color: '#fff', width: 4 }] }])).toThrow()
    expect(() => validatePages([{ ...validPage, texts: [{ lat: 1, lng: 2, text: '   ', size: 14 }] }])).toThrow()
  })

  it('clamps zoom, road width and text size', async () => {
    const { validatePages } = await import('../server/utils/locationMapStore')
    const [p] = validatePages([{
      ...validPage,
      zoom: 99,
      roads: [{ points: validPage.roads[0]!.points, color: '#fff', width: 99, dashed: false }],
      texts: [{ lat: 1, lng: 2, text: 'x', size: 999 }],
    }])
    expect(p!.zoom).toBe(22)
    expect(p!.roads[0]!.width).toBe(20)
    expect(p!.texts[0]!.size).toBe(72)
  })

  it('requires an uploaded picture with dimensions on image pages', async () => {
    const { validatePages } = await import('../server/utils/locationMapStore')
    const imagePage = { ...validPage, base: 'image', image: tinyJpeg, imageW: 1200, imageH: 800 }
    const [p] = validatePages([imagePage])
    expect(p).toMatchObject({ base: 'image', imageW: 1200, imageH: 800 })
    expect(() => validatePages([{ ...imagePage, image: undefined }])).toThrow()
    expect(() => validatePages([{ ...imagePage, image: 'https://evil.example/x.png' }])).toThrow()
    expect(() => validatePages([{ ...imagePage, imageW: 0 }])).toThrow()
  })

  it('accepts shapes, clamps opacity and rejects bad ones', async () => {
    const { validatePages } = await import('../server/utils/locationMapStore')
    const shape = { shape: 'rect', a: { lat: 64.1, lng: -21.9 }, b: { lat: 64.2, lng: -21.8 }, color: '#facc15', width: 3, fill: true, fillOpacity: 0.25 }
    const [p] = validatePages([{
      ...validPage,
      shapes: [shape, { ...shape, shape: 'circle', fillOpacity: 9, width: 99 }, { ...shape, fill: false, fillOpacity: 'x' }],
    }])
    expect(p!.shapes[0]).toMatchObject({ shape: 'rect', fill: true, fillOpacity: 0.25, width: 3 })
    expect(p!.shapes[1]).toMatchObject({ shape: 'circle', fillOpacity: 1, width: 20 })
    expect(p!.shapes[2]).toMatchObject({ fill: false, fillOpacity: 0.25 })
    expect(() => validatePages([{ ...validPage, shapes: [{ ...shape, shape: 'triangle' }] }])).toThrow()
    expect(() => validatePages([{ ...validPage, shapes: [{ ...shape, color: 'red' }] }])).toThrow()
    const [without] = validatePages([validPage])
    expect(without!.shapes).toEqual([])
  })

  it('keeps valid location numbers and drops invalid ones', async () => {
    const { validatePages } = await import('../server/utils/locationMapStore')
    const [p] = validatePages([{
      ...validPage,
      markers: [
        { kind: 'set', lat: 1, lng: 2, num: 1 },
        { kind: 'set', lat: 1, lng: 2, num: 2.6 },
        { kind: 'set', lat: 1, lng: 2, num: 0 },
        { kind: 'set', lat: 1, lng: 2, num: 'x' },
        { kind: 'set', lat: 1, lng: 2 },
      ],
    }])
    expect(p!.markers.map(m => m.num)).toEqual([1, 3, undefined, undefined, undefined])
  })

  it('defaults the text color and keeps a chosen one', async () => {
    const { validatePages } = await import('../server/utils/locationMapStore')
    const [p] = validatePages([{
      ...validPage,
      texts: [
        { lat: 1, lng: 2, text: 'gamalt', size: 14 },
        { lat: 1, lng: 2, text: 'nýtt', size: 14, color: '#26c6a2' },
        { lat: 1, lng: 2, text: 'rugl', size: 14, color: 'javascript:x' },
      ],
    }])
    expect(p!.texts.map(x => x.color)).toEqual(['#ffd75e', '#26c6a2', '#ffd75e'])
  })

  it('accepts vehicles and defaults a missing vehicles array', async () => {
    const { validatePages } = await import('../server/utils/locationMapStore')
    const [withVehicle] = validatePages([{
      ...validPage,
      vehicles: [{ id: 'v-1', kind: 'truck', lat: 64.14, lng: -21.9, lengthM: 10, widthM: 2.55, rotation: 90, color: '#cbd5e1', label: 'Ljósatrukkur' }],
    }])
    expect(withVehicle!.vehicles[0]).toMatchObject({ kind: 'truck', lengthM: 10, widthM: 2.55, rotation: 90, label: 'Ljósatrukkur' })
    const [without] = validatePages([validPage])
    expect(without!.vehicles).toEqual([])
  })

  it('rejects unknown vehicle kinds, clamps dimensions and wraps rotation', async () => {
    const { validatePages } = await import('../server/utils/locationMapStore')
    const vehicle = { kind: 'truck', lat: 1, lng: 2, lengthM: 10, widthM: 2.5, rotation: 0, color: '#fff' }
    expect(() => validatePages([{ ...validPage, vehicles: [{ ...vehicle, kind: 'tank' }] }])).toThrow()
    const [p] = validatePages([{
      ...validPage,
      vehicles: [
        { ...vehicle, lengthM: 99, widthM: 0.1, rotation: 450 },
        { ...vehicle, rotation: -90, color: 'not-a-color' },
      ],
    }])
    expect(p!.vehicles[0]).toMatchObject({ lengthM: 30, widthM: 0.5, rotation: 90 })
    expect(p!.vehicles[1]).toMatchObject({ rotation: 270, color: '#cbd5e1' })
  })

  it('drops the image fields on map pages', async () => {
    const { validatePages } = await import('../server/utils/locationMapStore')
    const [p] = validatePages([{ ...validPage, image: tinyJpeg, imageW: 10, imageH: 10 }])
    expect(p!.image).toBeUndefined()
  })
})
