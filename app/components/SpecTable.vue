<template>
  <dl class="divide-y divide-ink-700 border-y border-ink-700">
    <div v-for="row in rows" :key="row.label" class="flex items-center justify-between py-3 gap-6">
      <dt class="text-sm text-bone-400">{{ row.label }}</dt>
      <dd class="text-sm font-medium text-bone-100 text-right">{{ row.value }}</dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import type { VehicleKind, VehicleSpecs } from '~/types'

const props = defineProps<{ specs: VehicleSpecs, kind?: VehicleKind }>()

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

// Ordered, localized rows. Booleans only render when true ("—" rows are noise);
// enum values (drivetrain, transmission, fuel) map through the locale file.
const rows = computed(() => {
  const s = props.specs
  // A trailer has a load bed and a kerb weight, not a "box" and a "weight";
  // a caravan's figure is its maximum laden weight (what the licence rule goes by).
  const trailer = props.kind === 'trailer'
  const weightKey = trailer ? 'kerbWeightKg' : props.kind === 'caravan' ? 'grossWeightKg' : 'weightKg'
  const out: { label: string; value: string }[] = []
  const push = (key: string, value: string | undefined) => {
    if (value) out.push({ label: t(`vehicle.specs.${key}`), value })
  }

  push('units', s.units && s.units > 1 ? s.units.toString() : undefined)
  push('seats', s.seats?.toString())
  push('sleeps', s.sleeps?.toString())
  push('lengthM', s.lengthM ? `${num(s.lengthM)} m` : undefined)
  push('heightM', s.heightM ? `${num(s.heightM)} m` : undefined)
  push(weightKey, s.weightKg ? `${num(s.weightKg)} kg` : undefined)
  push('towingCapacityKg', s.towingCapacityKg ? `${num(s.towingCapacityKg)} kg` : undefined)
  push('payloadKg', s.payloadKg ? `${num(s.payloadKg)} kg` : undefined)
  const box = [s.boxLengthM, s.boxWidthM, s.boxHeightM].filter((n): n is number => Boolean(n))
  // The trailer's bed in centimetres, the unit its listing and FAQ use.
  push(trailer ? 'loadBed' : 'boxDimensions', box.length
    ? (trailer ? `${box.map(n => num(Math.round(n * 100))).join(' × ')} cm` : `${box.map(num).join(' × ')} m`)
    : undefined)
  push('drivetrain', s.drivetrain === '2wd' ? t('vehicle.specs.twoWheelDrive') : s.drivetrain)
  push('transmission', s.transmission ? t(`vehicle.specs.${s.transmission}`) : undefined)
  push('fuel', s.fuel ? t(`vehicle.specs.${s.fuel}`) : undefined)
  push('powerOutput', typeof s.powerOutput === 'string' ? s.powerOutput : lt(s.powerOutput))
  push('generator', s.generator ? t('common.yes') : undefined)
  push('heating', s.heating ? t('common.yes') : undefined)
  push('blackoutReady', s.blackoutReady ? t('common.yes') : undefined)
  push('winterEquipped', s.winterEquipped ? t('common.yes') : undefined)
  push('towHitch', s.towHitch ? t('common.yes') : undefined)
  push('wifi', s.wifi ? t('common.yes') : undefined)
  if (s.extra) out.push({ label: '·', value: lt(s.extra) })

  return out
})
</script>
