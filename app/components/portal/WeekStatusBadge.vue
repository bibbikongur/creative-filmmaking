<template>
  <span
    class="inline-block px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest border"
    :class="classes[status]"
  >
    {{ $t(`portal.status.${status}`) }}
  </span>
</template>

<script setup lang="ts">
import type { WeekStatus } from '~/types'

defineProps<{ status: WeekStatus }>()

const classes: Record<WeekStatus, string> = {
  draft: 'border-ink-700 text-bone-400',
  submitted: 'border-gold-600/60 text-gold-400',
  altered: 'border-signal-500/60 text-signal-500',
  approved: 'border-emerald-600/60 text-emerald-400',
}
</script>
