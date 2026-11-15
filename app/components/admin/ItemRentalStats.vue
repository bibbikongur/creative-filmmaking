<template>
  <!-- Never rented: one quiet line, so the form below stays at the top of the page -->
  <section v-if="loaded && !stats && !error" class="admin-card flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 sm:px-6">
    <h2 class="admin-card-title">Rental history</h2>
    <p class="flex-1 text-sm text-bone-400">Not on a confirmed offer yet.</p>
    <NuxtLink to="/admin/rentals" class="admin-link">All rental stats</NuxtLink>
  </section>
  <section v-else class="admin-card p-5 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="admin-card-title">Rental history</h2>
      <NuxtLink to="/admin/rentals" class="admin-link">All rental stats</NuxtLink>
    </div>

    <p v-if="error" class="mt-4 text-sm text-signal-400">{{ error }}</p>
    <p v-else-if="!loaded" class="mt-4 text-sm text-bone-400">Loading…</p>
    <template v-else-if="stats">
      <dl class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <dt class="admin-eyebrow">Times rented</dt>
          <dd class="mt-1 text-2xl font-semibold text-bone-100 tabular-nums">{{ stats.timesRented }}</dd>
        </div>
        <div>
          <dt class="admin-eyebrow">Units · days</dt>
          <dd class="mt-1 text-2xl font-semibold text-bone-100 tabular-nums">
            {{ stats.unitsRented }} <span class="text-bone-400 text-base font-normal">· {{ stats.rentalDays || '–' }}</span>
          </dd>
        </div>
        <div>
          <dt class="admin-eyebrow">Gross</dt>
          <dd class="mt-1 text-bone-100 tabular-nums"><AdminRentalMoney :amounts="stats.gross" class="!items-start" /></dd>
        </div>
        <div>
          <dt class="admin-eyebrow">Net of discounts</dt>
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
