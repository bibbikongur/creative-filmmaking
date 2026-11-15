<template>
  <div>
    <AdminPageHeader
      title="Categories"
      description="The order here is the order of the categories on the website."
      :crumbs="[{ label: 'Catalogue' }, { label: 'Equipment', to: '/admin/equipment' }, { label: 'Categories' }]"
    >
      <template #actions>
        <NuxtLink to="/admin/equipment/categories/new" class="btn-gold btn-sm"><AdminIcon name="plus" :size="16" /> Add category</NuxtLink>
      </template>
    </AdminPageHeader>

    <AdminStateMessage v-if="loadError" kind="error" class="mt-6">{{ loadError }}</AdminStateMessage>
    <AdminStateMessage v-else-if="!loaded" kind="loading" class="mt-6">Loading categories…</AdminStateMessage>

    <AdminStateMessage v-else-if="!categories.length" title="No categories yet" class="mt-6">
      Equipment is grouped by category on the website. Add the first one.
      <template #action>
        <NuxtLink to="/admin/equipment/categories/new" class="btn-gold btn-sm">Add category</NuxtLink>
      </template>
    </AdminStateMessage>

    <template v-else>
      <AdminToolbar class="mt-6" :count="`${active.length} active${archived.length ? `, ${archived.length} archived` : ''}`" />

      <div class="admin-list mt-4">
        <div class="admin-list-head hidden md:grid !pl-2" :class="cols">
          <span>Order</span>
          <span>Category</span>
          <span>Items</span>
          <span class="text-right">Actions</span>
        </div>
        <div v-for="(c, i) in active" :key="c.id">
          <div class="admin-row sm:!pl-2 md:grid" :class="cols">
            <div class="hidden shrink-0 items-center gap-1 sm:flex">
              <div class="relative z-10 hidden shrink-0 flex-col sm:flex">
              <button
                type="button"
                class="admin-icon-action !h-7 !w-8"
                :disabled="i === 0 || reordering"
                :aria-label="`Move ${c.name.en} up`"
                title="Move up"
                @click="move(i, -1)"
              >
                <AdminIcon name="up" :size="14" />
              </button>
              <button
                type="button"
                class="admin-icon-action !h-7 !w-8"
                :disabled="i === active.length - 1 || reordering"
                :aria-label="`Move ${c.name.en} down`"
                title="Move down"
                @click="move(i, 1)"
              >
                <AdminIcon name="down" :size="14" />
              </button>
            </div>
              <span class="hidden w-5 text-center text-xs tabular-nums text-ink-400 md:block">{{ i + 1 }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="sm:truncate">
                <NuxtLink :to="`/admin/equipment/categories/${c.id}`" class="admin-row-link">{{ c.name.en || c.name.is }}</NuxtLink>
                <span v-if="c.name.is && c.name.en && c.name.en !== c.name.is" class="text-bone-400"> · {{ c.name.is }}</span>
              </p>
              <p class="mt-0.5 text-xs text-ink-400 md:hidden">{{ count(c.id) ? `${count(c.id)} ${count(c.id) === 1 ? 'item' : 'items'}` : 'No items' }}</p>
            </div>
            <div class="relative z-10 hidden md:block">
              <button
                v-if="count(c.id)"
                type="button"
                class="admin-link"
                :aria-expanded="open.has(c.id)"
                @click="toggle(c.id)"
              >
                {{ open.has(c.id) ? 'Hide' : 'Show' }} {{ count(c.id) }} {{ count(c.id) === 1 ? 'item' : 'items' }}
              </button>
              <span v-else class="text-sm text-ink-400">No items</span>
            </div>
            <div class="admin-row-actions">
              <a :href="`/equipment/${c.slug.is}`" target="_blank" rel="noopener" class="admin-icon-action hidden sm:inline-flex" :aria-label="`View ${c.name.en} on the website`" title="View on the website">
                <AdminIcon name="external" />
              </a>
              <AdminIcon name="right" :size="16" class="ml-1 text-ink-500" />
            </div>
          </div>

          <!-- Items in this category -->
          <ul v-if="open.has(c.id)" class="border-t border-ink-800 bg-ink-950/40 divide-y divide-ink-800/60">
            <li v-for="e in itemsIn(c.id)" :key="e.id" class="relative flex items-center gap-3 py-2 pl-[4.5rem] pr-4 transition-colors hover:bg-ink-800/60">
              <AdminThumb :src="e.images[0]" :alt="e.name.en" size="sm" />
              <p class="min-w-0 flex-1 truncate text-sm">
                <NuxtLink :to="`/admin/equipment/${e.id}`" class="admin-row-link !font-normal">{{ e.name.en || e.name.is }}</NuxtLink>
                <span v-if="e.featured" class="admin-chip ml-2 border-gold-500/40 text-gold-400">Featured</span>
              </p>
              <AdminIcon name="right" :size="16" class="text-ink-500" />
            </li>
          </ul>
        </div>
        <p v-if="!active.length" class="px-4 py-10 text-center text-sm text-bone-400">
          No active categories. Restore an archived one below, or add a new one.
        </p>
      </div>

      <template v-if="archived.length">
        <h2 class="mt-10 font-heading text-lg font-semibold uppercase tracking-wide text-bone-100">Archived</h2>
        <p class="mt-1 text-sm text-bone-400">Hidden from the website.</p>
        <div class="admin-list mt-3">
          <div v-for="c in archived" :key="c.id" class="admin-row">
            <div class="min-w-0 flex-1">
              <p class="sm:truncate">
                <NuxtLink :to="`/admin/equipment/categories/${c.id}`" class="admin-row-link !text-bone-400">{{ c.name.en || c.name.is }}</NuxtLink>
                <span v-if="c.name.is && c.name.en && c.name.en !== c.name.is" class="text-ink-400"> · {{ c.name.is }}</span>
              </p>
            </div>
            <div class="admin-row-actions">
              <AdminIcon name="right" :size="16" class="ml-1 text-ink-500" />
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { EquipmentCategoryDef, EquipmentItem } from '~/types'

definePageMeta({ layout: 'admin' })
const { alertDialog } = useAppDialog()

const cols = 'md:grid-cols-[3.75rem_minmax(0,1fr)_8rem_5rem]'

const categories = ref<EquipmentCategoryDef[]>([])
const items = ref<EquipmentItem[]>([])
const loaded = ref(false)
const loadError = ref('')
const reordering = ref(false)

const active = computed(() => categories.value.filter(c => c.status === 'active'))
const archived = computed(() => categories.value.filter(c => c.status === 'archived'))
const itemsIn = (id: string) => items.value.filter(e => e.category === id)
const count = (id: string) => itemsIn(id).length

// Which categories have their item list expanded
const open = ref(new Set<string>())
const toggle = (id: string) => {
  const next = new Set(open.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  open.value = next
}

const load = async () => {
  loadError.value = ''
  try {
    ;[categories.value, items.value] = await Promise.all([
      $fetch<EquipmentCategoryDef[]>('/api/admin/equipment-categories', { query: { t: Date.now() } }),
      $fetch<EquipmentItem[]>('/api/equipment', { query: { t: Date.now() } }),
    ])
    loaded.value = true
  }
  catch {
    loadError.value = 'Could not load categories. Is the server running?'
  }
}

onMounted(load)

const move = async (index: number, delta: number) => {
  const previous = categories.value
  const nextActive = [...active.value]
  const [moved] = nextActive.splice(index, 1)
  nextActive.splice(index + delta, 0, moved!)
  const next = [...nextActive, ...archived.value]
  categories.value = next
  reordering.value = true
  try {
    await $fetch('/api/admin/equipment-categories/reorder', { method: 'PUT', body: { ids: next.map(c => c.id) } })
    clearNuxtData('equipment-categories')
  }
  catch (err: any) {
    categories.value = previous
    await alertDialog(err?.data?.statusMessage || 'Could not save the new order.')
  }
  finally {
    reordering.value = false
  }
}

useHead({ title: 'Equipment categories · Admin · Creative Filmmaking' })
</script>
