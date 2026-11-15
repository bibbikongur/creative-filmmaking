<template>
  <div>
    <AdminPageHeader
      title="Vehicles"
      description="The fleet as listed on the website."
      :crumbs="[{ label: 'Catalogue' }, { label: 'Vehicles' }]"
    >
      <template #actions>
        <NuxtLink to="/admin/vehicles/new" class="btn-gold btn-sm"><AdminIcon name="plus" :size="16" /> Add vehicle</NuxtLink>
      </template>
    </AdminPageHeader>

    <AdminStateMessage v-if="loadError" kind="error" class="mt-6">{{ loadError }}</AdminStateMessage>
    <AdminStateMessage v-else-if="!loaded" kind="loading" class="mt-6">Loading the fleet…</AdminStateMessage>

    <AdminStateMessage v-else-if="!vehicles.length" title="No vehicles yet" class="mt-6">
      Add the first vehicle and it appears on the website straight away.
      <template #action>
        <NuxtLink to="/admin/vehicles/new" class="btn-gold btn-sm">Add vehicle</NuxtLink>
      </template>
    </AdminStateMessage>

    <template v-else>
      <AdminToolbar v-model:search="search" class="mt-6" placeholder="Search vehicles…" :count="countLabel">
        <button
          v-for="c in categoryOptions"
          :key="c.value"
          type="button"
          class="admin-pill"
          :class="{ 'admin-pill-active': category === c.value }"
          :aria-pressed="category === c.value"
          @click="category = c.value"
        >
          {{ c.label }} <span class="tabular-nums opacity-70">{{ c.count }}</span>
        </button>
      </AdminToolbar>

      <div class="admin-list mt-4">
        <div class="admin-list-head hidden md:grid" :class="cols">
          <span>Vehicle</span>
          <span>Category</span>
          <span class="text-right">Actions</span>
        </div>
        <div v-for="v in visible" :key="v.id" class="admin-row md:grid" :class="cols">
          <div class="flex min-w-0 flex-1 items-center gap-4">
            <AdminThumb :src="v.images[0]" :alt="v.name.en" icon="vehicles" class="max-sm:!h-9 max-sm:!w-12" />
            <div class="min-w-0">
              <p class="flex items-center gap-2">
                <NuxtLink :to="`/admin/vehicles/${v.id}`" class="admin-row-link line-clamp-2 sm:line-clamp-none sm:truncate">{{ v.name.en }}</NuxtLink>
                <span v-if="v.featured" class="admin-chip hidden sm:inline-flex border-gold-500/40 text-gold-400">Featured</span>
              </p>
              <p class="mt-0.5 text-xs text-ink-400 md:hidden">
                {{ categoryLabel(v.category) }}<span v-if="v.featured" class="text-gold-400"> · Featured</span>
              </p>
              <p v-if="v.plates?.length" class="mt-0.5 hidden truncate text-xs text-ink-400 md:block">{{ v.plates.join(', ') }}</p>
            </div>
          </div>
          <p class="hidden md:block text-sm text-bone-400">{{ categoryLabel(v.category) }}</p>
          <div class="admin-row-actions">
            <a :href="`/vehicles/${v.slug}`" target="_blank" rel="noopener" class="admin-icon-action hidden sm:inline-flex" :aria-label="`View ${v.name.en} on the website`" title="View on the website">
              <AdminIcon name="external" />
            </a>
            <button
              type="button"
              class="admin-icon-action-danger max-sm:!hidden"
              :disabled="deleting === v.id"
              :aria-label="`Delete ${v.name.en}`"
              title="Delete"
              @click="remove(v)"
            >
              <AdminIcon name="trash" />
            </button>
            <AdminIcon name="right" :size="16" class="ml-1 text-ink-500" />
          </div>
        </div>

        <p v-if="!visible.length" class="px-4 py-10 text-center text-sm text-bone-400">
          No vehicles match.
          <button type="button" class="text-gold-400 hover:text-gold-500" @click="search = ''; category = 'all'">Clear filters</button>
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Vehicle, VehicleCategory } from '~/types'

definePageMeta({ layout: 'admin' })
const { confirmDialog, alertDialog } = useAppDialog()

const cols = 'md:grid-cols-[minmax(0,1fr)_11rem_7.5rem]'

const vehicles = ref<Vehicle[]>([])
const loaded = ref(false)
const loadError = ref('')
const deleting = ref('')

const load = async () => {
  loadError.value = ''
  try {
    vehicles.value = await $fetch<Vehicle[]>('/api/admin/vehicles', {
      query: { t: Date.now() }, // bypass any intermediary cache
    })
    loaded.value = true
  }
  catch {
    loadError.value = 'Could not load the fleet. Is the server running?'
  }
}

onMounted(load)

// ---------- Filter ----------
const labels: Record<VehicleCategory, string> = {
  'campers': 'Campers',
  'equipment-cars': 'Equipment cars',
  'support-vehicles': 'Support vehicles',
  'trailers': 'Trailers',
}
const categoryLabel = (c: VehicleCategory) => labels[c] ?? c

const search = ref('')
const category = ref<VehicleCategory | 'all'>('all')

const categoryOptions = computed(() => [
  { value: 'all' as const, label: 'All', count: vehicles.value.length },
  ...(Object.keys(labels) as VehicleCategory[])
    .map(value => ({ value, label: labels[value], count: vehicles.value.filter(v => v.category === value).length }))
    .filter(o => o.count),
])

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return vehicles.value.filter(v =>
    (category.value === 'all' || v.category === category.value)
    && (!q || [v.name.en, v.name.is, v.slug, ...(v.plates ?? [])].some(s => s?.toLowerCase().includes(q))))
})

const countLabel = computed(() =>
  visible.value.length === vehicles.value.length
    ? `${vehicles.value.length} ${vehicles.value.length === 1 ? 'vehicle' : 'vehicles'}`
    : `${visible.value.length} of ${vehicles.value.length}`)

const remove = async (v: Vehicle) => {
  if (!await confirmDialog(`Delete "${v.name.en}"? This removes it from the website immediately.`)) return
  deleting.value = v.id
  try {
    await $fetch(`/api/admin/vehicles/${v.id}`, { method: 'DELETE' })
    vehicles.value = vehicles.value.filter(x => x.id !== v.id)
    clearNuxtData('fleet') // public pages refetch on next visit
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || 'Delete failed.')
  }
  finally {
    deleting.value = ''
  }
}

useHead({ title: 'Vehicles · Admin · Creative Filmmaking' })
</script>
