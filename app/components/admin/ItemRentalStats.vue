<template>
  <section class="border border-ink-800 bg-ink-900/50 p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xs uppercase tracking-widest text-bone-400">Rental history</h2>
      <NuxtLink to="/admin/rentals" class="text-xs text-bone-400 hover:text-gold-400 transition-colors">All rentals →</NuxtLink>
    </div>

    <p v-if="error" class="mt-4 text-sm text-signal-500">{{ error }}</p>
    <p v-else-if="!loaded" class="mt-4 text-sm text-bone-400">Loading…</p>
    <p v-else-if="!stats" class="mt-4 text-sm text-bone-400">
      Not on any confirmed offer yet. Confirm an offer under its quote to start counting rentals here.
    </p>
    <template v-else>
      <dl class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <dt class="text-xs uppercase tracking-widest text-bone-400">Times rented</dt>
          <dd class="mt-1 text-2xl font-semibold text-bone-100 tabular-nums">{{ stats.timesRented }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-widest text-bone-400">Units · days</dt>
          <dd class="mt-1 text-2xl font-semibold text-bone-100 tabular-nums">
            {{ stats.unitsRented }} <span class="text-bone-400 text-base font-normal">· {{ stats.rentalDays || '–' }}</span>
          </dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-widest text-bone-400">Gross</dt>
          <dd class="mt-1 text-bone-100 tabular-nums"><AdminRentalMoney :amounts="stats.gross" class="!items-start" /></dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-widest text-bone-400">Net of discounts</dt>
          <dd class="mt-1 text-bone-100 tabular-nums"><AdminRentalMoney :amounts="stats.net" class="!items-start" /></dd>
        </div>
      </dl>
      <AdminRentalHistory :rentals="stats.rentals" class="mt-5" />
    </template>
  </section>
</template>

<script setup lang="ts">
import type { CartItemType, ItemRentalStats } from '~/types'

const props = defineProps<{ itemType: CartItemType, itemId: string }>()

const stats = ref<ItemRentalStats | null>(null)
const loaded = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    const res = await $fetch<{ item: ItemRentalStats | null }>('/api/admin/rental-stats', {
      query: { type: props.itemType, id: props.itemId, t: Date.now() },
    })
    stats.value = res.item
  }
  catch {
    error.value = 'Could not load the rental history.'
  }
  finally {
    loaded.value = true
  }
})
</script>
