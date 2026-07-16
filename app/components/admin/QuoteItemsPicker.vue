<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2 class="text-xs uppercase tracking-widest text-bone-400">
        Items <span class="text-gold-400">({{ modelValue.length }} selected)</span>
      </h2>
      <input
        v-model.trim="search"
        type="search"
        class="input-dark !w-64"
        placeholder="Search vehicles & equipment…"
      >
    </div>

    <p v-if="catalogueError" class="mt-4 text-sm text-signal-500">{{ catalogueError }}</p>
    <p v-else-if="!catalogueLoaded" class="mt-4 text-sm text-bone-400">Loading catalogue…</p>

    <template v-else>
      <!-- Selected -->
      <div v-if="modelValue.length" class="mt-4 border border-gold-500/30 divide-y divide-ink-800">
        <div v-for="entry in modelValue" :key="`${entry.type}:${entry.id}`" class="flex items-center gap-4 p-3">
          <img
            v-if="entry.image"
            :src="entry.image"
            :alt="entry.name"
            class="w-16 h-11 object-cover bg-ink-800 shrink-0"
            loading="lazy"
          >
          <div v-else class="w-16 h-11 bg-ink-800 shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-bone-100 truncate">{{ entry.name }}</p>
            <p class="mt-0.5 text-xs uppercase tracking-widest text-bone-400">{{ entry.type }}</p>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs uppercase tracking-widest text-bone-400">Qty</label>
            <input
              v-model.number="entry.qty"
              type="number"
              min="1"
              step="1"
              class="input-dark !w-20 text-right"
            >
          </div>
          <button
            type="button"
            class="text-xs uppercase tracking-widest text-signal-500/80 hover:text-signal-500 transition-colors"
            @click="remove(entry.type, entry.id)"
          >
            Remove
          </button>
        </div>
      </div>

      <!-- Catalogue -->
      <div class="mt-4 grid gap-x-8 gap-y-6 lg:grid-cols-2">
        <div v-for="group in groups" :key="group.label">
          <h3 class="text-xs uppercase tracking-widest text-bone-400">{{ group.label }}</h3>
          <div class="mt-2 border border-ink-800 divide-y divide-ink-800 max-h-96 overflow-y-auto">
            <button
              v-for="row in group.rows"
              :key="row.item.id"
              type="button"
              class="w-full flex items-center gap-3 p-2.5 text-left transition-colors"
              :class="isSelected(row.type, row.item.id) ? 'bg-gold-500/10' : 'hover:bg-ink-900'"
              @click="toggle(row.type, row.item)"
            >
              <img
                v-if="row.item.images[0]"
                :src="row.item.images[0]"
                :alt="row.item.name.en"
                class="w-14 h-10 object-cover bg-ink-800 shrink-0"
                loading="lazy"
              >
              <div v-else class="w-14 h-10 bg-ink-800 shrink-0" />
              <span class="min-w-0 flex-1 text-sm text-bone-100 truncate">{{ row.item.name.en }}</span>
              <span class="text-xs uppercase tracking-widest shrink-0" :class="isSelected(row.type, row.item.id) ? 'text-gold-400' : 'text-bone-400'">
                {{ isSelected(row.type, row.item.id) ? '✓ Added' : '+ Add' }}
              </span>
            </button>
            <p v-if="!group.rows.length" class="p-4 text-xs text-bone-400">No matches.</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CartItemType, EquipmentItem, QuoteDraftItem, Vehicle } from '~/types'

const props = defineProps<{ modelValue: QuoteDraftItem[] }>()
const emit = defineEmits<{ 'update:modelValue': [QuoteDraftItem[]] }>()

const vehicles = ref<Vehicle[]>([])
const equipment = ref<EquipmentItem[]>([])
const catalogueLoaded = ref(false)
const catalogueError = ref('')

onMounted(async () => {
  try {
    ;[vehicles.value, equipment.value] = await Promise.all([
      $fetch<Vehicle[]>('/api/vehicles'),
      $fetch<EquipmentItem[]>('/api/equipment'),
    ])
    catalogueLoaded.value = true
  }
  catch {
    catalogueError.value = 'Could not load the catalogue. Is the server running?'
  }
})

const isSelected = (type: CartItemType, id: string) =>
  props.modelValue.some(e => e.type === type && e.id === id)

const remove = (type: CartItemType, id: string) =>
  emit('update:modelValue', props.modelValue.filter(e => !(e.type === type && e.id === id)))

const toggle = (type: CartItemType, item: Vehicle | EquipmentItem) => {
  if (isSelected(type, item.id)) return remove(type, item.id)
  emit('update:modelValue', [
    ...props.modelValue,
    { type, id: item.id, qty: 1, name: item.name.en, image: item.images[0] },
  ])
}

const search = ref('')
const matches = (item: Vehicle | EquipmentItem) => {
  const q = search.value.toLowerCase()
  return !q || item.name.en.toLowerCase().includes(q) || item.name.is.toLowerCase().includes(q)
}
const groups = computed(() => [
  { label: 'Vehicles', rows: vehicles.value.filter(matches).map(item => ({ type: 'vehicle' as const, item })) },
  { label: 'Equipment', rows: equipment.value.filter(matches).map(item => ({ type: 'equipment' as const, item })) },
])
</script>
