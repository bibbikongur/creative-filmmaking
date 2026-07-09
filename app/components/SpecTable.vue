<template>
  <dl class="divide-y divide-ink-700 border-y border-ink-700">
    <div v-for="row in rows" :key="row.label" class="flex items-center justify-between py-3 gap-6">
      <dt class="text-sm text-bone-400">{{ row.label }}</dt>
      <dd class="text-sm font-medium text-bone-100 text-right">{{ row.value }}</dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import type { VehicleSpecs } from '~/types'

const props = defineProps<{ specs: VehicleSpecs }>()

const { t } = useI18n()
const { lt } = useLocalized()

// Ordered, localized rows. Booleans only render when true ("—" rows are noise);
// enum values (drivetrain, transmission, fuel) map through the locale file.
const rows = computed(() => {
  const s = props.specs
  const out: { label: string; value: string }[] = []
  const push = (key: string, value: string | undefined) => {
    if (value) out.push({ label: t(`vehicle.specs.${key}`), value })
  }

  push('units', s.units?.toString())
  push('seats', s.seats?.toString())
  push('sleeps', s.sleeps?.toString())
  push('lengthM', s.lengthM ? `${s.lengthM} m` : undefined)
  push('heightM', s.heightM ? `${s.heightM} m` : undefined)
  push('drivetrain', s.drivetrain?.toUpperCase())
  push('transmission', s.transmission ? t(`vehicle.specs.${s.transmission}`) : undefined)
  push('fuel', s.fuel ? t(`vehicle.specs.${s.fuel}`) : undefined)
  push('powerOutput', s.powerOutput)
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
