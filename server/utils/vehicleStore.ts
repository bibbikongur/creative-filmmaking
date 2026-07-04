import { promises as fs } from 'node:fs'
import { join, resolve } from 'node:path'
import { vehicles as seedVehicles } from '~~/app/data/vehicles'
import type { LocalizedText, Vehicle, VehicleCategory, VehicleSpecs } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Runtime fleet store — a JSON file in the data dir, seeded once from
// app/data/vehicles.ts. The admin panel edits this file; the static TS file
// is only the initial content. Set NUXT_DATA_DIR to a persistent volume in
// production (e.g. /data on Railway) so edits survive redeploys.
// ─────────────────────────────────────────────────────────────────────────────

export const dataDir = () =>
  resolve(process.cwd(), useRuntimeConfig().dataDir || '.data')

export const uploadsDir = () => join(dataDir(), 'uploads')

const storeFile = () => join(dataDir(), 'vehicles.json')

let cache: Vehicle[] | null = null

export async function getVehicles(): Promise<Vehicle[]> {
  if (cache) return cache
  try {
    cache = JSON.parse(await fs.readFile(storeFile(), 'utf8')) as Vehicle[]
  }
  catch {
    // First run (or unreadable file): seed from the static data file.
    cache = seedVehicles
    await persist(cache).catch(() => {}) // read-only FS shouldn't break the site
  }
  return cache
}

async function persist(vehicles: Vehicle[]) {
  await fs.mkdir(dataDir(), { recursive: true })
  const tmp = `${storeFile()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(vehicles, null, 2), 'utf8')
  await fs.rename(tmp, storeFile())
}

export async function saveVehicles(vehicles: Vehicle[]) {
  cache = vehicles
  await persist(vehicles)
}

// ── Payload validation ───────────────────────────────────────────────────────

const CATEGORIES: VehicleCategory[] = ['campers', 'crew-trucks', 'support-vehicles', 'trailers']
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

/** Validate + normalize an admin-submitted vehicle. Throws 400 with a list of errors. */
export function parseVehiclePayload(body: unknown): Omit<Vehicle, 'id'> {
  const b = (body ?? {}) as Record<string, unknown>
  const errors: string[] = []

  const slug = asText(b.slug).toLowerCase()
  if (!SLUG_RE.test(slug)) errors.push('Slug must be lowercase letters and numbers separated by dashes (e.g. arctic-base-4x4-camper).')

  const category = oneOf(CATEGORIES, b.category)
  if (!category) errors.push('Category is required.')

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
    seats: asPositive(s.seats),
    sleeps: asPositive(s.sleeps),
    lengthM: asPositive(s.lengthM),
    heightM: asPositive(s.heightM),
    drivetrain: oneOf(DRIVETRAINS, s.drivetrain),
    transmission: oneOf(TRANSMISSIONS, s.transmission),
    fuel: oneOf(FUELS, s.fuel),
    powerOutput: asText(s.powerOutput) || undefined,
    generator: asFlag(s.generator),
    heating: asFlag(s.heating),
    blackoutReady: asFlag(s.blackoutReady),
    winterEquipped: asFlag(s.winterEquipped),
    towHitch: asFlag(s.towHitch),
    wifi: asFlag(s.wifi),
    extra: extra.en || extra.is ? extra : undefined,
  }

  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors } })
  }

  return {
    slug,
    category: category!,
    featured: b.featured === true,
    name,
    tagline,
    description,
    highlights,
    specs,
    images,
  }
}
