<template>
  <div>
    <AdminPageHeader
      title="Equipment"
      description="Grouped by category, in the order the website shows them."
      :crumbs="[{ label: 'Catalogue' }, { label: 'Equipment' }]"
    >
      <template #actions>
        <NuxtLink to="/admin/equipment/new" class="btn-gold btn-sm"><AdminIcon name="plus" :size="16" /> Add equipment</NuxtLink>
      </template>
    </AdminPageHeader>

    <AdminStateMessage v-if="loadError" kind="error" class="mt-6">{{ loadError }}</AdminStateMessage>
    <AdminStateMessage v-else-if="!loaded" kind="loading" class="mt-6">Loading equipment…</AdminStateMessage>

    <AdminStateMessage v-else-if="!items.length" title="No equipment yet" class="mt-6">
      Add the first item and it appears on the website straight away.
      <template #action>
        <NuxtLink to="/admin/equipment/new" class="btn-gold btn-sm">Add equipment</NuxtLink>
      </template>
    </AdminStateMessage>

    <template v-else>
      <AdminToolbar v-model:search="search" class="mt-6" placeholder="Search equipment…" :count="countLabel">
        <template #end>
          <button type="button" class="admin-pill" :disabled="searching" :class="{ 'opacity-40': searching }" @click="toggleAll">
            {{ allCollapsed ? 'Expand all' : 'Collapse all' }}
          </button>
        </template>
      </AdminToolbar>
      <p v-if="searching" class="mt-3 hidden text-xs text-ink-400 sm:block">Reordering is paused while a search is active.</p>

      <section v-for="group in visibleGroups" :key="group.id" class="admin-list mt-4" :aria-labelledby="`group-${group.id}`">
        <div class="flex items-center gap-3 bg-ink-900 pl-2 pr-4">
          <h2 :id="`group-${group.id}`" class="min-w-0 flex-1 font-sans">
            <button
              type="button"
              class="flex w-full items-center gap-2 py-3 text-left text-sm font-semibold text-bone-100 transition-colors hover:text-gold-400"
              :aria-expanded="!isCollapsed(group.id)"
              @click="toggle(group.id)"
            >
              <AdminIcon :name="isCollapsed(group.id) ? 'right' : 'down'" :size="16" class="text-ink-400" />
              <span class="truncate">{{ group.title }}</span>
              <span v-if="group.subtitle" class="hidden truncate font-normal text-bone-400 sm:inline">· {{ group.subtitle }}</span>
              <span class="text-xs font-normal text-ink-400 tabular-nums">{{ group.items.length }}</span>
              <span v-if="group.archived" class="admin-chip border-ink-700 text-bone-400">Archived</span>
            </button>
          </h2>
          <NuxtLink v-if="group.editTo" :to="group.editTo" class="admin-link shrink-0 !no-underline">Edit category</NuxtLink>
        </div>

        <template v-if="!isCollapsed(group.id)">
          <div v-for="(e, i) in group.items" :key="e.id" class="admin-row !py-2 sm:!pl-2">
            <div class="relative z-10 hidden shrink-0 flex-col sm:flex">
              <button
                type="button"
                class="admin-icon-action !h-7 !w-8"
                :disabled="i === 0 || busy || searching"
                :aria-label="`Move ${e.name.en} up`"
                title="Move up"
                @click="move(group, i, -1)"
              >
                <AdminIcon name="up" :size="14" />
              </button>
              <button
                type="button"
                class="admin-icon-action !h-7 !w-8"
                :disabled="i === group.items.length - 1 || busy || searching"
                :aria-label="`Move ${e.name.en} down`"
                title="Move down"
                @click="move(group, i, 1)"
              >
                <AdminIcon name="down" :size="14" />
              </button>
            </div>
            <AdminThumb :src="e.images[0]" :alt="e.name.en" size="sm" />
            <div class="min-w-0 flex-1">
              <p class="flex items-center gap-2">
                <NuxtLink :to="`/admin/equipment/${e.id}`" class="admin-row-link line-clamp-2 sm:line-clamp-none sm:truncate">{{ e.name.en || e.name.is }}</NuxtLink>
                <span v-if="e.featured" class="admin-chip hidden sm:inline-flex border-gold-500/40 text-gold-400">Featured</span>
              </p>
              <p v-if="(e.name.is && e.name.en && e.name.is !== e.name.en) || e.featured" class="mt-0.5 truncate text-xs text-ink-400">
                <template v-if="e.name.is && e.name.en && e.name.is !== e.name.en">{{ e.name.is }}</template>
                <span v-if="e.featured" class="text-gold-400 sm:hidden"> · Featured</span>
              </p>
            </div>
            <div class="admin-row-actions">
              <!-- "Move to another category": the native picker opens straight from the icon -->
              <label class="admin-icon-action relative hidden cursor-pointer sm:inline-flex" :class="{ 'opacity-30': busy }" title="Move to another category">
                <AdminIcon name="categories" />
                <select
                  class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  :value="e.category"
                  :disabled="busy"
                  :aria-label="`Move ${e.name.en} to another category`"
                  @change="moveTo(e, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="c in activeCategories" :key="c.id" :value="c.id">{{ c.name.en || c.name.is }}</option>
                  <option v-if="!activeCategories.some(c => c.id === e.category)" :value="e.category">{{ categoryName(e.category) }}</option>
                </select>
              </label>
              <a :href="`/equipment/${equipmentSlug(e)}`" target="_blank" rel="noopener" class="admin-icon-action hidden sm:inline-flex" :aria-label="`View ${e.name.en} on the website`" title="View on the website">
                <AdminIcon name="external" />
              </a>
              <button
                type="button"
                class="admin-icon-action-danger max-sm:!hidden"
                :disabled="deleting === e.id"
                :aria-label="`Delete ${e.name.en}`"
                title="Delete"
                @click="remove(e)"
              >
                <AdminIcon name="trash" />
              </button>
              <AdminIcon name="right" :size="16" class="ml-1 text-ink-500" />
            </div>
          </div>
          <p v-if="!group.items.length" class="px-4 py-4 text-sm text-ink-400">No items in this category.</p>
        </template>
      </section>

      <AdminStateMessage v-if="!visibleGroups.length" class="mt-4">
        No equipment matches “{{ search }}”.
        <template #action>
          <button type="button" class="btn-outline btn-sm" @click="search = ''">Clear search</button>
        </template>
      </AdminStateMessage>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { EquipmentCategoryDef, EquipmentItem } from '~/types'

definePageMeta({ layout: 'admin' })
const { confirmDialog, alertDialog } = useAppDialog()

const items = ref<EquipmentItem[]>([])
const categories = ref<EquipmentCategoryDef[]>([])
const loaded = ref(false)
const loadError = ref('')
const deleting = ref('')
const busy = ref(false)

const activeCategories = computed(() => categories.value.filter(c => c.status === 'active'))

const categoryName = (id: string) => {
  const c = categories.value.find(x => x.id === id)
  return c ? (c.name.en || c.name.is) + (c.status === 'archived' ? ' (archived)' : '') : id
}

interface Group {
  id: string
  title: string
  /** The Icelandic name, when it differs from the title */
  subtitle: string
  archived: boolean
  editTo: string
  items: EquipmentItem[]
}

// One group per category in the admin's category order (archived ones only
// when they still hold items), then anything whose category no longer exists.
const groups = computed<Group[]>(() => {
  const list = items.value
  const out: Group[] = []
  for (const c of categories.value) {
    const inCat = list.filter(e => e.category === c.id)
    if (c.status === 'archived' && !inCat.length) continue
    out.push({ id: c.id, title: c.name.en || c.name.is, subtitle: c.name.is && c.name.is !== c.name.en ? c.name.is : '', archived: c.status === 'archived', editTo: `/admin/equipment/categories/${c.id}`, items: inCat })
  }
  const known = new Set(categories.value.map(c => c.id))
  const orphans = list.filter(e => !known.has(e.category))
  if (orphans.length) out.push({ id: 'other', title: 'No category', subtitle: '', archived: false, editTo: '', items: orphans })
  return out
})

// ---------- Search and collapse ----------
const search = ref('')
const searching = computed(() => !!search.value.trim())

// While searching: only groups with a match, and only the matching items.
const visibleGroups = computed<Group[]>(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return groups.value
  return groups.value
    .map(g => ({ ...g, items: g.items.filter(e => [e.name.is, e.name.en, equipmentSlug(e)].some(s => s?.toLowerCase().includes(q))) }))
    .filter(g => g.items.length)
})

const countLabel = computed(() => {
  const shown = visibleGroups.value.reduce((n, g) => n + g.items.length, 0)
  return searching.value
    ? `${shown} of ${items.value.length}`
    : `${items.value.length} ${items.value.length === 1 ? 'item' : 'items'} in ${groups.value.length} ${groups.value.length === 1 ? 'category' : 'categories'}`
})

const collapsed = ref(new Set<string>())
// A search always shows its matches, whatever was collapsed before.
const isCollapsed = (id: string) => !searching.value && collapsed.value.has(id)
const toggle = (id: string) => {
  const next = new Set(collapsed.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsed.value = next
}
const allCollapsed = computed(() => groups.value.length > 0 && groups.value.every(g => collapsed.value.has(g.id)))
const toggleAll = () => {
  collapsed.value = allCollapsed.value ? new Set() : new Set(groups.value.map(g => g.id))
}

const load = async () => {
  loadError.value = ''
  try {
    ;[items.value, categories.value] = await Promise.all([
      $fetch<EquipmentItem[]>('/api/equipment', { query: { t: Date.now() } }), // bypass any intermediary cache
      $fetch<EquipmentCategoryDef[]>('/api/admin/equipment-categories', { query: { t: Date.now() } }),
    ])
    loaded.value = true
  }
  catch {
    loadError.value = 'Could not load equipment. Is the server running?'
  }
}

onMounted(load)

// Saves the global order as "every group in display order", which is also
// how the site lists them. Only the moved item's position changes visibly.
const saveOrder = async (nextGroups: Group[]) => {
  const previous = items.value
  const next = nextGroups.flatMap(g => g.items)
  items.value = next
  busy.value = true
  try {
    await $fetch('/api/admin/equipment/reorder', { method: 'PUT', body: { ids: next.map(e => e.id) } })
    clearNuxtData('equipment') // public pages refetch on next visit
  }
  catch (err: any) {
    items.value = previous
    await alertDialog(err?.data?.statusMessage || 'Could not save the new order.')
  }
  finally {
    busy.value = false
  }
}

// Only reachable with no search active, so `group` is a full, unfiltered group.
const move = (group: Group, index: number, delta: number) => {
  if (searching.value) return
  const reordered = [...group.items]
  const [moved] = reordered.splice(index, 1)
  reordered.splice(index + delta, 0, moved!)
  saveOrder(groups.value.map(g => (g.id === group.id ? { ...g, items: reordered } : g)))
}

// Change an item's category in place; the whole item is sent since the save
// endpoint validates the complete payload. It lands at the end of its new group.
const moveTo = async (e: EquipmentItem, category: string) => {
  if (category === e.category) return
  busy.value = true
  try {
    const saved = await $fetch<EquipmentItem>(`/api/admin/equipment/${e.id}`, {
      method: 'PUT',
      body: { ...e, slug: equipmentSlug(e), category },
    })
    items.value = items.value.map(x => (x.id === e.id ? saved : x))
    clearNuxtData('equipment')
    await saveOrder(groups.value)
  }
  catch (err: any) {
    await alertDialog(err?.data?.data?.errors?.join(' ') || err?.data?.statusMessage || 'Could not move the item.')
  }
  finally {
    busy.value = false
  }
}

const remove = async (e: EquipmentItem) => {
  if (!await confirmDialog(`Delete "${e.name.en}"? This removes it from the website immediately.`)) return
  deleting.value = e.id
  try {
    await $fetch(`/api/admin/equipment/${e.id}`, { method: 'DELETE' })
    items.value = items.value.filter(x => x.id !== e.id)
    clearNuxtData('equipment') // public pages refetch on next visit
  }
  catch (err: any) {
    await alertDialog(err?.data?.statusMessage || 'Delete failed.')
  }
  finally {
    deleting.value = ''
  }
}

useHead({ title: 'Equipment · Admin · Creative Filmmaking' })
</script>
