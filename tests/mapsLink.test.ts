import { describe, expect, it } from 'vitest'
import { extractCoordsFromMapsUrl, isShortMapsLink } from '../app/utils/mapsLink'

describe('extractCoordsFromMapsUrl', () => {
  it('prefers the place marker (!3d!4d) over the viewport (@)', () => {
    const url = 'https://www.google.com/maps/place/%C3%9Eingvellir/@64.3,-21.4,12z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d64.2559!4d-21.1301!16z'
    expect(extractCoordsFromMapsUrl(url)).toEqual({ lat: 64.2559, lng: -21.1301 })
  })

  it('reads the viewport center when no marker is present', () => {
    expect(extractCoordsFromMapsUrl('https://www.google.com/maps/@64.1466,-21.871,14z'))
      .toEqual({ lat: 64.1466, lng: -21.871 })
  })

  it('reads q= and ll= query params, also URL-encoded', () => {
    expect(extractCoordsFromMapsUrl('https://maps.google.com/?q=64.25,-21.13'))
      .toEqual({ lat: 64.25, lng: -21.13 })
    expect(extractCoordsFromMapsUrl('https://www.google.com/maps?ll=64.25%2C-21.13&z=12'))
      .toEqual({ lat: 64.25, lng: -21.13 })
  })

  it('returns null for links without coordinates', () => {
    expect(extractCoordsFromMapsUrl('https://maps.app.goo.gl/AbCdEf123')).toBeNull()
    expect(extractCoordsFromMapsUrl('https://www.google.com/maps/place/Reykjavik')).toBeNull()
    expect(extractCoordsFromMapsUrl('not a url')).toBeNull()
  })

  it('rejects out-of-range coordinates', () => {
    expect(extractCoordsFromMapsUrl('https://maps.google.com/?q=99.9,-21.13')).toBeNull()
  })
})

describe('isShortMapsLink', () => {
  it('detects Google short links only', () => {
    expect(isShortMapsLink('https://maps.app.goo.gl/AbCdEf123')).toBe(true)
    expect(isShortMapsLink('https://goo.gl/maps/xyz')).toBe(true)
    expect(isShortMapsLink('https://www.google.com/maps/@64,-21,12z')).toBe(false)
    expect(isShortMapsLink('https://example.com/maps.app.goo.gl/x')).toBe(false)
  })
})
