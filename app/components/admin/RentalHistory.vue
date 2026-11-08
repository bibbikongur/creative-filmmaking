<template>
  <div class="border border-ink-800 divide-y divide-ink-800 text-sm">
    <div
      v-for="r in rentals"
      :key="`${r.offerId}-${r.quoteId}`"
      class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 bg-ink-950/40"
    >
      <div class="min-w-0 flex-1">
        <NuxtLink :to="`/admin/quotes/${r.quoteId}`" class="font-medium text-bone-100 hover:text-gold-400 transition-colors">
          {{ r.customer }}<span v-if="r.company" class="text-bone-400 font-normal"> · {{ r.company }}</span>
        </NuxtLink>
        <p class="mt-0.5 text-xs text-bone-400">
          Confirmed {{ formatDate(r.confirmedAt) }} · offer #{{ r.offerId }}
          <span v-if="r.dates"> · {{ r.dates }}</span>
        </p>
      </div>
      <p class="text-xs text-bone-400 tabular-nums">
        {{ r.qty }} × <span v-if="r.days">{{ r.days }} {{ r.days === 1 ? 'day' : 'days' }}</span><span v-else>flat</span>
      </p>
      <p class="text-right tabular-nums text-bone-100">
        {{ money(r.gross, r.currency) }}
        <span v-if="r.net !== r.gross" class="block text-xs text-bone-400">net {{ money(r.net, r.currency) }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ItemRental } from '~/types'

defineProps<{ rentals: ItemRental[] }>()

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const money = (n: number, currency: string) =>
  currency === 'EUR' ? `€${n.toLocaleString('en-US')}` : `${n.toLocaleString('is-IS')} kr.`
</script>
