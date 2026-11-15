<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2 class="admin-card-title">
        Items <span class="font-sans text-[11px] font-medium normal-case tracking-normal text-ink-400">{{ modelValue.length }} selected</span>
      </h2>
      <label class="relative w-full sm:w-72">
        <span class="sr-only">Search the catalogue</span>
        <AdminIcon name="search" :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input v-model.trim="search" type="search" class="admin-field w-full !pl-9" placeholder="Search the catalogue…">
      </label>
    </div>

    <p v-if="catalogueError" class="mt-4 text-sm text-signal-500">{{ catalogueError }}</p>
    <p v-else-if="!catalogueLoaded" class="mt-4 text-sm text-bone-400">Loading catalogue…</p>

    <template v-else>
      <!-- Selected -->
      <div v-if="modelValue.length" class="mt-4 border border-gold-500/30 divide-y divide-ink-800">
        <div v-for="entry in modelValue" :key="`${entry.type}:${entry.id}`" class="flex items-center gap-4 p-3">
          <AdminThumb :src="entry.image" :alt="entry.name" :icon="entry.type === 'vehicle' ? 'vehicles' : 'equipment'" />
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-bone-100 truncate">{{ entry.name }}</p>
            <p class="mt-0.5 text-xs capitalize text-ink-400">{{ entry.type }}</p>
            <!-- Services need saying what they are for; the text is printed under the line on the offer. -->
            <input
              v-if="entry.type === 'service'"
              v-model.trim="entry.note"
              type="text"
              maxlength="200"
              class="input-dark mt-2 !py-1.5 text-sm"
              placeholder="What is it for? e.g. Crew transfer Keflavík – Reykjavík, 12 Nov"
            >
          </div>
          <div class="flex items-center gap-2">
            <label class="admin-eyebrow">Qty</label>
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
            class="admin-icon-action-danger"
            :aria-label="`Remove ${entry.name}`"
            title="Remove"
            @click="remove(entry.type, entry.id)"
          >
            <AdminIcon name="close" />
          </button>
        </div>
      </div>

      <!-- Catalogue -->
      <div class="mt-4 grid gap-x-8 gap-y-6 lg:grid-cols-3">
        <div v-for="group in groups" :key="group.label">
          <h3 class="admin-eyebrow">{{ group.label }} <span class="font-normal tabular-nums">· {{ group.rows.length }}</span></h3>
          <div class="relative mt-2 border border-ink-800">
          <div class="max-h-[26rem] divide-y divide-ink-800 overflow-y-auto">
            <button
              v-for="row in group.rows"
              :key="row.item.id"
              type="button"
              class="w-full flex items-center gap-3 p-2.5 text-left transition-colors"
              :aria-pressed="isSelected(row.type, row.item.id)"
              :class="isSelected(row.type, row.item.id) ? 'bg-gold-500/10' : 'hover:bg-ink-800/60'"
              @click="toggle(row.type, row.item)"
            >
              <AdminThumb :src="row.item.images[0]" :alt="row.item.name.en" size="sm" :icon="row.type === 'vehicle' ? 'vehicles' : 'equipment'" />
              <span class="min-w-0 flex-1 text-sm leading-snug text-bone-100 line-clamp-2">{{ row.item.name.en }}</span>
              <span class="inline-flex shrink-0 items-center gap-1 text-xs font-medium" :class="isSelected(row.type, row.item.id) ? 'text-gold-400' : 'text-bone-400'">
                <AdminIcon :name="isSelected(row.type, row.item.id) ? 'check' : 'plus'" :size="14" />
                {{ isSelected(row.type, row.item.id) ? 'Added' : 'Add' }}
              </span>
            </button>
            <p v-if="!group.rows.length" class="p-4 text-xs text-bone-400">No matches.</p>
          </div>
          <p v-if="group.rows.length > 7" class="border-t border-ink-800 bg-ink-900 px-3 py-1.5 text-center text-[11px] text-ink-400">{{ group.rows.length }} in this list. Scroll or search to see more.</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CartItemType, EquipmentItem, QuoteDraftItem, Vehicle } from '~/types'
import { SERVICES, type ServiceItem } from '~/data/services'

type PickableItem = Vehicle | EquipmentItem | ServiceItem

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

const toggle = (type: CartItemType, item: PickableItem) => {
  if (isSelected(type, item.id)) return remove(type, item.id)
  emit('update:modelValue', [
    ...props.modelValue,
    { type, id: item.id, qty: 1, name: item.name.en, image: item.images[0] },
  ])
}

const search = ref('')
const matches = (item: PickableItem) => {
  const q = search.value.toLowerCase()
  return !q || item.name.en.toLowerCase().includes(q) || item.name.is.toLowerCase().includes(q)
}
const groups = computed(() => [
  { label: 'Vehicles', rows: vehicles.value.filter(matches).map(item => ({ type: 'vehicle' as const, item })) },
  { label: 'Equipment', rows: equipment.value.filter(matches).map(item => ({ type: 'equipment' as const, item })) },
  // Built-in services (see app/data/services.ts); not part of the public catalogue.
  { label: 'Services', rows: SERVICES.filter(matches).map(item => ({ type: 'service' as const, item })) },
])
</script>
