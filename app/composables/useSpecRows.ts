import type { MaybeRefOrGetter } from 'vue'
import type { VehicleKind, VehicleSpecs } from '~/types'

export interface SpecRow {
  /** Spec field the row comes from ("seats", "box", "extra", …) */
  key: string
  label: string
  /** Shorter label where there is one (the key-facts tiles) */
  shortLabel: string
  value: string
  /** A yes/no feature (rendered as "Yes"), not a figure */
  flag: boolean
}

/**
 * A vehicle's specs as ordered, localized rows: the spec table shows all of
 * them, the key-facts tiles at the top of the page pick the first few figures.
 * Booleans only produce a row when true ("no" rows are noise); enum values
 * (drivetrain, transmission, fuel) map through the locale file.
 */
export const useSpecRows = (specs: MaybeRefOrGetter<VehicleSpecs>, kind?: MaybeRefOrGetter<VehicleKind | undefined>) => {
  const { t, locale } = useI18n()
  const { lt } = useLocalized()

  // Numbers the way the page's language writes them (7,5 m and 1.800 kg in
  // Icelandic), done by hand: the server's Intl data does not always know "is".
  const num = (n: number) => {
    const [whole, frac] = String(n).split('.')
    const is = locale.value === 'is'
    const grouped = whole!.replace(/\B(?=(\d{3})+(?!\d))/g, is ? '.' : ',')
    return frac ? `${grouped}${is ? ',' : '.'}${frac}` : grouped
  }

  return computed<SpecRow[]>(() => {
    const s = toValue(specs)
    const k = toValue(kind)
    // A trailer has a load bed and a kerb weight, not a "box" and a "weight";
    // a caravan's figure is its maximum laden weight (what the licence rule goes by).
    const trailer = k === 'trailer'
    const weightKey = trailer ? 'kerbWeightKg' : k === 'caravan' ? 'grossWeightKg' : 'weightKg'
    const out: SpecRow[] = []
    const push = (key: string, value: string | undefined, opts: { labelKey?: string, shortKey?: string, flag?: boolean } = {}) => {
      if (!value) return
      const label = t(`vehicle.specs.${opts.labelKey ?? key}`)
      out.push({ key, label, shortLabel: opts.shortKey ? t(`vehicle.specs.${opts.shortKey}`) : label, value, flag: Boolean(opts.flag) })
    }
    const flag = (key: string, on: boolean | undefined) => push(key, on ? t('common.yes') : undefined, { flag: true })

    push('units', s.units && s.units > 1 ? s.units.toString() : undefined)
    push('seats', s.seats?.toString())
    push('sleeps', s.sleeps?.toString())
    push('lengthM', s.lengthM ? `${num(s.lengthM)} m` : undefined)
    push('heightM', s.heightM ? `${num(s.heightM)} m` : undefined)
    push('weightKg', s.weightKg ? `${num(s.weightKg)} kg` : undefined, { labelKey: weightKey })
    push('towingCapacityKg', s.towingCapacityKg ? `${num(s.towingCapacityKg)} kg` : undefined)
    push('payloadKg', s.payloadKg ? `${num(s.payloadKg)} kg` : undefined)
    const box = [s.boxLengthM, s.boxWidthM, s.boxHeightM].filter((n): n is number => Boolean(n))
    // The trailer's bed in centimetres, the unit its listing and FAQ use.
    push('box', box.length
      ? (trailer ? `${box.map(n => num(Math.round(n * 100))).join(' × ')} cm` : `${box.map(num).join(' × ')} m`)
      : undefined, { labelKey: trailer ? 'loadBed' : 'boxDimensions', shortKey: trailer ? 'loadBedShort' : 'boxShort' })
    push('drivetrain', s.drivetrain === '2wd' ? t('vehicle.specs.twoWheelDrive') : s.drivetrain)
    push('transmission', s.transmission ? t(`vehicle.specs.${s.transmission}`) : undefined)
    push('fuel', s.fuel ? t(`vehicle.specs.${s.fuel}`) : undefined)
    push('powerOutput', typeof s.powerOutput === 'string' ? s.powerOutput : lt(s.powerOutput))
    flag('generator', s.generator)
    flag('heating', s.heating)
    flag('blackoutReady', s.blackoutReady)
    flag('winterEquipped', s.winterEquipped)
    flag('towHitch', s.towHitch)
    flag('wifi', s.wifi)
    if (s.extra && lt(s.extra)) out.push({ key: 'extra', label: '·', shortLabel: '·', value: lt(s.extra), flag: false })

    return out
  })
}

// Figures before features, in the order a renter asks: how many people, how
// much it holds and pulls, then how it drives. Two-wheel drive is the default
// and not worth a tile. The long box measurement goes last so it can take a
// full-width tile.
const KEY_FACT_ORDER = ['sleeps', 'seats', 'payloadKg', 'towingCapacityKg', 'drivetrain', 'transmission', 'weightKg', 'lengthM', 'fuel']

/**
 * Splits a vehicle's spec rows for the listing page: up to four deciding
 * figures for the tiles beside the photo, and the rows the tiles leave out.
 */
export const splitSpecRows = (rows: SpecRow[], specs: VehicleSpecs) => {
  const picked = KEY_FACT_ORDER
    .filter(key => !(key === 'drivetrain' && specs.drivetrain === '2wd'))
    .map(key => rows.find(r => r.key === key))
    .filter((r): r is SpecRow => Boolean(r))
  const box = rows.find(r => r.key === 'box')
  // Four tiles; with a box measurement, two figures above it and the box across the foot.
  const facts = box ? [...picked.slice(0, 2), box] : picked.slice(0, 4)
  // What the tiles leave out. Two-wheel drive is the default: it stays in the full
  // table and is not worth a line of its own anywhere else.
  const rest = rows.filter(r => !facts.includes(r) && !(r.key === 'drivetrain' && specs.drivetrain === '2wd'))
  return { facts, rest }
}
