<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="kicker">Equipment</p>
        <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">Manage equipment</h1>
        <p class="mt-2 max-w-2xl text-sm text-bone-400">
          Grouped the way the site shows them. Arrows reorder within a category; "Move to" puts an item in
          another category. Category order is set on the Categories page.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink to="/admin/equipment/categories" class="btn-ghost !px-5 !py-2.5">Categories</NuxtLink>
        <NuxtLink to="/admin/equipment/new" class="btn-gold !px-5 !py-2.5">+ Add equipment</NuxtLink>
      </div>
    </div>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="mt-8 text-sm text-bone-400">Loading equipment…</p>

    <template v-else>
      <section v-for="group in groups" :key="group.id" class="mt-8">
        <div class="flex flex-wrap items-end justify-between gap-3 pb-2 border-b border-ink-700">
          <h2 class="font-heading font-semibold uppercase tracking-wide text-bone-100 flex items-baseline gap-2">
            <button type="button" class="hover:text-gold-400 transition-colors inline-flex items-center gap-2" :aria-expanded="!collapsed.has(group.id)" @click="toggle(group.id)">
              <span aria-hidden="true" class="text-xs text-bone-400">{{ collapsed.has(group.id) ? '▸' : '▾' }}</span>
              {{ group.title }}
            </button>
            <span class="text-xs tracking-widest text-bone-400 font-sans font-normal">{{ group.items.length }} item{{ group.items.length === 1 ? '' : 's' }}</span>
            <span v-if="group.archived" class="text-[10px] uppercase tracking-widest text-bone-400 border border-ink-700 px-1.5 py-0.5 font-sans font-normal">Archived</span>
          </h2>
          <NuxtLink v-if="group.editTo" :to="group.editTo" class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors">Edit category</NuxtLink>
        </div>

        <div v-if="!collapsed.has(group.id)" class="border border-t-0 border-ink-800 divide-y divide-ink-800">
          <div
            v-for="(e, i) in group.items"
            :key="e.id"
            class="flex items-center gap-4 p-4 bg-ink-900/50 hover:bg-ink-900 transition-colors"
          >
            <div class="flex flex-col shrink-0">
              <button
                type="button"
                class="px-1.5 py-0.5 text-bone-400 hover:text-bone-100 transition-colors disabled:opacity-25 disabled:hover:text-bone-400"
                :disabled="i === 0 || busy"
                aria-label="Move up"
                @click="move(group, i, -1)"
              >▲</button>
              <button
                type="button"
                class="px-1.5 py-0.5 text-bone-400 hover:text-bone-100 transition-colors disabled:opacity-25 disabled:hover:text-bone-400"
                :disabled="i === group.items.length - 1 || busy"
                aria-label="Move down"
                @click="move(group, i, 1)"
              >▼</button>
            </div>
            <img
              v-if="e.images[0]"
              :src="e.images[0]"
              :alt="e.name.en"
              class="w-20 h-14 object-cover bg-ink-800 shrink-0"
              loading="lazy"
            >
            <div v-else class="w-20 h-14 flex items-center justify-center bg-ink-800 shrink-0 text-[10px] uppercase tracking-widest text-bone-400/50">
              No photo
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-bone-100 truncate">
                {{ e.name.is || e.name.en }}
                <span v-if="e.name.is && e.name.en" class="text-bone-400 font-normal">· {{ e.name.en }}</span>
                <span v-if="e.featured" class="ml-2 text-[10px] uppercase tracking-widest text-gold-500 border border-gold-500/40 px-1.5 py-0.5">Featured</span>
              </p>
              <p class="mt-0.5 text-xs text-bone-400 font-mono truncate">/equipment/{{ equipmentSlug(e) }}</p>
            </div>
            <label class="shrink-0 flex items-center gap-2 text-xs uppercase tracking-widest text-bone-400">
              <span class="hidden lg:inline">Move to</span>
              <select
                class="input-dark !w-44 !py-1.5 !text-xs normal-case tracking-normal"
                :value="e.category"
                :disabled="busy"
                :aria-label="`Category for ${e.name.en}`"
                @change="moveTo(e, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="c in activeCategories" :key="c.id" :value="c.id">{{ c.name.is || c.name.en }}</option>
                <option v-if="!activeCategories.some(c => c.id === e.category)" :value="e.category">{{ categoryName(e.category) }}</option>
              </select>
            </label>
            <NuxtLink :to="`/admin/equipment/${e.id}`" class="btn-ghost !px-4 !py-2 !text-xs">Edit</NuxtLink>
            <button
              type="button"
              class="text-xs uppercase tracking-widest text-signal-500/80 hover:text-signal-500 transition-colors disabled:opacity-50"
              :disabled="deleting === e.id"
              @click="remove(e)"
            >
              {{ deleting === e.id ? '…' : 'Delete' }}
            </button>
          </div>
        </div>
      </section>

      <p v-if="!items.length" class="mt-8 p-8 border border-ink-800 text-center text-sm text-bone-400">
        No equipment yet. Add the first item.
      </p>
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
  return c ? (c.name.is || c.name.en) + (c.status === 'archived' ? ' (archived)' : '') : id
}

interface Group {
  id: string
  title: string
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
    out.push({ id: c.id, title: c.name.is || c.name.en, archived: c.status === 'archived', editTo: `/admin/equipment/categories/${c.id}`, items: inCat })
  }
  const known = new Set(categories.value.map(c => c.id))
  const orphans = list.filter(e => !known.has(e.category))
  if (orphans.length) out.push({ id: 'other', title: 'No category', archived: false, editTo: '', items: orphans })
  return out
})

const collapsed = ref(new Set<string>())
const toggle = (id: string) => {
  const next = new Set(collapsed.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsed.value = next
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

const move = (group: Group, index: number, delta: number) => {
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

useHead({ title: 'Equipment · Admin' })
</script>
