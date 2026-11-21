import type { LocalizedText, Vehicle, VehicleCategory, VehicleKind, VehicleSpecs } from '~~/app/types'
import { RESERVED_VEHICLE_SLUGS, vehicleKinds } from '~~/app/data/vehicleLandings'

// ─────────────────────────────────────────────────────────────────────────────
// Runtime fleet store — rows in the SQLite database (see db.ts), stored as
// JSON documents so this API stays a plain Vehicle[] in/out. The admin panel
// edits the database; app/data/vehicles.ts is only the first-boot seed.
// ─────────────────────────────────────────────────────────────────────────────

export async function getVehicles(): Promise<Vehicle[]> {
  const rows = getDb().prepare('SELECT data FROM vehicles ORDER BY sort').all() as { data: string }[]
  return rows.map(r => JSON.parse(r.data) as Vehicle)
}

export async function saveVehicles(vehicles: Vehicle[]) {
  const db = getDb()
  // Full rewrite, but updated_at must survive it: keep the old stamp when a
  // row's JSON is byte-identical, stamp now when it changed or is new. The
  // sitemap turns these into lastmod.
  const prev = new Map(
    (db.prepare('SELECT id, data, updated_at FROM vehicles').all() as { id: string, data: string, updated_at: string | null }[])
      .map(r => [r.id, r]),
  )
  const now = new Date().toISOString()
  const insert = db.prepare('INSERT INTO vehicles (id, slug, sort, data, updated_at) VALUES (?, ?, ?, ?, ?)')
  db.transaction(() => {
    db.prepare('DELETE FROM vehicles').run()
    vehicles.forEach((v, i) => {
      const json = JSON.stringify(v)
      const old = prev.get(v.id)
      insert.run(v.id, v.slug, i, json, old && old.data === json ? old.updated_at : now)
    })
  })()
}

// ── Payload validation ───────────────────────────────────────────────────────

const CATEGORIES: VehicleCategory[] = ['campers', 'equipment-cars', 'support-vehicles', 'trailers']
const DRIVETRAINS = ['4x4', '2wd', '6x6'] as const
const TRANSMISSIONS = ['automatic', 'manual'] as const
const FUELS = ['diesel', 'petrol', 'hybrid'] as const
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const asText = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

const asLocalized = (v: unknown): LocalizedText => {
  const o = (v ?? {}) as Record<string, unknown>
  return { en: asText(o.en), is: asText(o.is) }
}

const asPositive = (v: unknown): number | undefined => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) && n > 0 ? n : undefined
}

const asFlag = (v: unknown): true | undefined => (v === true ? true : undefined)

const oneOf = <T extends string>(options: readonly T[], v: unknown): T | undefined =>
  options.includes(v as T) ? (v as T) : undefined

// Free text per language ({ en, is }); a plain string from older rows is kept as is.
const asPowerOutput = (v: unknown): VehicleSpecs['powerOutput'] => {
  if (typeof v === 'string') return v.trim() || undefined
  const t = asLocalized(v)
  return t.en || t.is ? t : undefined
}

/** Validate + normalize an admin-submitted vehicle. Throws 400 with a list of errors. */
export function parseVehiclePayload(body: unknown): Omit<Vehicle, 'id'> {
  const b = (body ?? {}) as Record<string, unknown>
  const errors: string[] = []

  const slug = asText(b.slug).toLowerCase()
  if (!SLUG_RE.test(slug)) errors.push('Slug must be lowercase letters and numbers separated by dashes (e.g. arctic-base-4x4-camper).')
  else if (RESERVED_VEHICLE_SLUGS.includes(slug)) errors.push(`"${slug}" is the address of a category page and can't be used as a vehicle slug.`)

  // Optional English address (/en/vehicles/<slugEn>); empty = same as the slug.
  const slugEnRaw = asText(b.slugEn).toLowerCase()
  const slugEn = slugEnRaw && slugEnRaw !== slug ? slugEnRaw : ''
  if (slugEn && !SLUG_RE.test(slugEn)) errors.push('English slug must be lowercase letters and numbers separated by dashes (e.g. ford-transit-box-truck).')
  else if (slugEn && RESERVED_VEHICLE_SLUGS.includes(slugEn)) errors.push(`"${slugEn}" is the address of a category page and can't be used as a vehicle slug.`)

  const category = oneOf(CATEGORIES, b.category)
  if (!category) errors.push('Category is required.')

  const kind: VehicleKind | undefined = oneOf(vehicleKinds, b.kind)

  // Manufacturer, model and model year: structured data for search engines.
  const make = asText(b.make).slice(0, 60)
  const model = asText(b.model).slice(0, 80)
  const year = Math.trunc(Number(b.modelYear))
  const modelYear = year >= 1950 && year <= 2100 ? year : undefined

  const name = asLocalized(b.name)
  if (!name.en) errors.push('English name is required.')

  const tagline = asLocalized(b.tagline)
  if (!tagline.en) errors.push('English tagline is required.')

  const description = asLocalized(b.description)

  const highlights = (Array.isArray(b.highlights) ? b.highlights : [])
    .map(asLocalized)
    .filter(h => h.en || h.is)

  const images = (Array.isArray(b.images) ? b.images : [])
    .map(asText)
    .filter(src => /^(https?:\/\/|\/)/.test(src))
  if (!images.length) errors.push('At least one image is required.')

  const s = (b.specs ?? {}) as Record<string, unknown>
  const extra = asLocalized(s.extra)
  const specs: VehicleSpecs = {
    units: asPositive(s.units),
    seats: asPositive(s.seats),
    sleeps: asPositive(s.sleeps),
    lengthM: asPositive(s.lengthM),
    heightM: asPositive(s.heightM),
    weightKg: asPositive(s.weightKg),
    towingCapacityKg: asPositive(s.towingCapacityKg),
    payloadKg: asPositive(s.payloadKg),
    boxLengthM: asPositive(s.boxLengthM),
    boxWidthM: asPositive(s.boxWidthM),
    boxHeightM: asPositive(s.boxHeightM),
    drivetrain: oneOf(DRIVETRAINS, s.drivetrain),
    transmission: oneOf(TRANSMISSIONS, s.transmission),
    fuel: oneOf(FUELS, s.fuel),
    powerOutput: asPowerOutput(s.powerOutput),
    generator: asFlag(s.generator),
    heating: asFlag(s.heating),
    blackoutReady: asFlag(s.blackoutReady),
    winterEquipped: asFlag(s.winterEquipped),
    towHitch: asFlag(s.towHitch),
    wifi: asFlag(s.wifi),
    extra: extra.en || extra.is ? extra : undefined,
  }

  // Registration numbers: array or one comma/newline-separated string.
  const plates = (Array.isArray(b.plates) ? b.plates : asText(b.plates).split(/[,\n;]/))
    .map(p => asText(p).toUpperCase().slice(0, 12))
    .filter((p, i, arr) => p && arr.indexOf(p) === i)

  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors } })
  }

  return {
    slug,
    ...(slugEn ? { slugEn } : {}),
    category: category!,
    ...(kind ? { kind } : {}),
    ...(make ? { make } : {}),
    ...(model ? { model } : {}),
    ...(modelYear ? { modelYear } : {}),
    featured: b.featured === true,
    name,
    tagline,
    description,
    highlights,
    specs,
    images,
    ...(plates.length ? { plates } : {}),
  }
}

/**
 * No two vehicles may answer to the same address in either language: a
 * vehicle's slug and English slug must both be unused by every other vehicle.
 */
export function assertUniqueVehicleSlugs(candidate: Pick<Vehicle, 'id' | 'slug' | 'slugEn'>, others: Vehicle[]) {
  const mine = [candidate.slug, candidate.slugEn].filter(Boolean) as string[]
  for (const o of others) {
    if (o.id === candidate.id) continue
    const clash = mine.find(s => s === o.slug || s === o.slugEn)
    if (clash) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: [`The address /vehicles/${clash} is already used by "${o.name.en}". Pick a different slug.`] },
      })
    }
  }
}

/** Public shape of a vehicle: registration numbers stay in the admin panel. */
export function publicVehicle(v: Vehicle): Vehicle {
  const { plates: _plates, ...rest } = v
  return rest
}
