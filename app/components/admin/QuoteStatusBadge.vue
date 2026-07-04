<template>
  <span
    class="shrink-0 text-[10px] uppercase tracking-widest px-2 py-1 border"
    :class="classes[status]"
  >
    {{ status }}
  </span>
</template>

<script setup lang="ts">
import type { QuoteStatus } from '~/types'

defineProps<{ status: QuoteStatus }>()

const classes: Record<QuoteStatus, string> = {
  new: 'text-gold-400 border-gold-500/50',
  offered: 'text-sky-400 border-sky-500/50',
  won: 'text-emerald-400 border-emerald-500/50',
  lost: 'text-bone-400 border-ink-500',
}
</script>
