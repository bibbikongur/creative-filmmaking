<template>
  <!-- What is on the visitor's quote list right now: name, quantity, remove.
       Used in the catalogue rail and in the phone's bottom sheet. -->
  <ul class="divide-y divide-ink-800">
    <li v-for="row in rows" :key="`${row.type}:${row.id}`" class="flex items-center gap-2.5 py-2">
      <div class="min-w-0 flex-1">
        <p class="text-[13px] leading-snug font-medium text-bone-100 line-clamp-2" :title="row.full">{{ keepUnits(row.main) }}</p>
        <p v-if="row.detail" class="text-xs leading-snug text-bone-400 truncate">{{ row.detail }}</p>
      </div>

      <!-- Equipment rents in multiples: − qty +, where − on the last one removes it -->
      <div v-if="row.type === 'equipment' || row.max > 1" class="shrink-0 inline-flex items-stretch border border-ink-700 text-bone-100">
        <button
          type="button"
          class="inline-flex items-center justify-center transition-colors hover:bg-ink-800"
          :class="[size, row.qty > 1 ? 'hover:text-gold-400' : 'text-bone-400 hover:text-signal-400']"
          :aria-label="`${row.qty > 1 ? t('cart.decrease') : t('cart.remove')}: ${row.full}`"
          :title="row.qty > 1 ? t('cart.decrease') : t('cart.remove')"
          @click="row.qty > 1 ? cart.setQty(row.type, row.id, row.qty - 1) : cart.remove(row.type, row.id)"
        >
          <svg v-if="row.qty > 1" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" />
          </svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.87 12.14A2 2 0 0116.14 21H7.86a2 2 0 01-1.99-1.86L5 7m5 4v6m4-6v6M4 7h16M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
          </svg>
        </button>
        <span class="min-w-[1.5rem] px-1 inline-flex items-center justify-center text-[13px] font-semibold tabular-nums whitespace-nowrap">{{ row.qty }}<span v-if="row.max > 1" class="font-normal text-bone-400">/{{ row.max }}</span></span>
        <button
          type="button"
          class="inline-flex items-center justify-center transition-colors hover:bg-ink-800 hover:text-gold-400 disabled:opacity-35 disabled:hover:bg-transparent"
          :class="size"
          :aria-label="`${t('cart.increase')}: ${row.full}`"
          :title="t('cart.increase')"
          :disabled="row.max > 1 && row.qty >= row.max"
          @click="cart.setQty(row.type, row.id, row.qty + 1)"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <!-- A vehicle is one physical unit: remove only -->
      <button
        v-else
        type="button"
        class="shrink-0 inline-flex items-center justify-center border border-ink-700 text-bone-400 transition-colors hover:bg-ink-800 hover:text-signal-400"
        :class="size"
        :aria-label="`${t('cart.remove')}: ${row.full}`"
        :title="t('cart.remove')"
        @click="cart.remove(row.type, row.id)"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.87 12.14A2 2 0 0116.14 21H7.86a2 2 0 01-1.99-1.86L5 7m5 4v6m4-6v6M4 7h16M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
        </svg>
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Finger-sized controls (the phone sheet); the rail uses the compact size */
  touch?: boolean
}>()

const { t } = useI18n()
const { lt } = useLocalized()
const cart = useCart()
const { all: equipment } = await useEquipment()
const { all: vehicles } = await useVehicles()

const size = computed(() => (props.touch ? 'w-11 h-11' : 'w-7 h-7'))

// Entries hold only {type, id, qty}; names come from the catalogue. Entries
// whose item is gone are skipped here (the cart page prunes them for good).
const rows = computed(() => cart.entries.value.flatMap((entry) => {
  const vehicle = entry.type === 'vehicle' ? vehicles().find(v => v.id === entry.id) : undefined
  const item = vehicle ?? (entry.type === 'equipment' ? equipment().find(e => e.id === entry.id) : undefined)
  if (!item) return []
  const full = lt(item.name)
  // A vehicle rents in multiples only when the fleet has several identical units.
  const max = vehicle ? (vehicle.specs.units ?? 1) : 0
  return [{ type: entry.type, id: entry.id, qty: entry.qty, max, full, ...splitEquipmentName(full) }]
}))
</script>
