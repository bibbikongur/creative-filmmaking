<template>
  <span
    class="inline-block px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest border whitespace-nowrap"
    :class="classes[status ?? 'notSent']"
  >
    {{ $t(`portal.docs.status.${status ?? 'notSent'}`) }}
  </span>
</template>

<script setup lang="ts">
import type { MemberDocStatus } from '~/types'

defineProps<{ status?: MemberDocStatus }>()

const classes: Record<MemberDocStatus | 'notSent', string> = {
  notSent: 'border-ink-700 text-bone-400',
  sent: 'border-gold-600/60 text-gold-400',
  delivered: 'border-sky-600/60 text-sky-400',
  completed: 'border-emerald-600/60 text-emerald-400',
  declined: 'border-signal-500/60 text-signal-500',
}
</script>
