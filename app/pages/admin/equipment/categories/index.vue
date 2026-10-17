<template>
  <div>
    <NuxtLink to="/admin/equipment" class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors">← Equipment</NuxtLink>

    <div class="mt-3 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="kicker">Equipment</p>
        <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">Categories</h1>
        <p class="mt-2 max-w-2xl text-sm text-bone-400">
          Each category has its own page on the site (/equipment/&lt;slug&gt;). The order here is the order of the
          filter pills and the rows on the equipment page.
        </p>
      </div>
      <NuxtLink to="/admin/equipment/categories/new" class="btn-gold !px-5 !py-2.5">+ Add category</NuxtLink>
    </div>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="mt-8 text-sm text-bone-400">Loading categories…</p>

    <template v-else>
      <div class="mt-8 border border-ink-800 divide-y divide-ink-800">
        <div v-for="(c, i) in active" :key="c.id" class="bg-ink-900/50 hover:bg-ink-900 transition-colors">
          <div class="flex items-center gap-4 p-4">
            <div class="flex flex-col shrink-0">
              <button
                type="button"
                class="px-1.5 py-0.5 text-bone-400 hover:text-bone-100 transition-colors disabled:opacity-25 disabled:hover:text-bone-400"
                :disabled="i === 0 || reordering"
                aria-label="Move up"
                @click="move(i, -1)"
              >▲</button>
              <button
                type="button"
                class="px-1.5 py-0.5 text-bone-400 hover:text-bone-100 transition-colors disabled:opacity-25 disabled:hover:text-bone-400"
                :disabled="i === active.length - 1 || reordering"
                aria-label="Move down"
                @click="move(i, 1)"
              >▼</button>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-bone-100 truncate">
                {{ c.name.is }} <span class="text-bone-400 font-normal">· {{ c.name.en }}</span>
              </p>
              <p class="mt-0.5 text-xs text-bone-400 font-mono truncate">/equipment/{{ c.slug.is }} · /en/equipment/{{ c.slug.en }}</p>
            </div>
            <button
              type="button"
              class="text-xs uppercase tracking-widest shrink-0 inline-flex items-center gap-1.5 transition-colors"
              :class="open.has(c.id) ? 'text-gold-400' : 'text-bone-400 hover:text-bone-100'"
              :aria-expanded="open.has(c.id)"
              :disabled="!count(c.id)"
              @click="toggle(c.id)"
            >
              {{ count(c.id) }} item{{ count(c.id) === 1 ? '' : 's' }}
              <span v-if="count(c.id)" aria-hidden="true">{{ open.has(c.id) ? '▴' : '▾' }}</span>
            </button>
            <NuxtLink :to="`/admin/equipment/categories/${c.id}`" class="btn-ghost !px-4 !py-2 !text-xs">Edit</NuxtLink>
          </div>

          <!-- Items in this category -->
          <ul v-if="open.has(c.id)" class="border-t border-ink-800 bg-ink-950/40 divide-y divide-ink-800/60">
            <li v-for="e in itemsIn(c.id)" :key="e.id" class="flex items-center gap-3 py-2 pl-14 pr-4">
              <img v-if="e.images[0]" :src="e.images[0]" :alt="e.name.en" class="w-12 h-9 object-cover bg-ink-800 shrink-0" loading="lazy">
              <div v-else class="w-12 h-9 bg-ink-800 shrink-0" />
              <p class="min-w-0 flex-1 text-sm text-bone-100 truncate">
                {{ e.name.is || e.name.en }}
                <span v-if="e.name.is && e.name.en" class="text-bone-400">· {{ e.name.en }}</span>
                <span v-if="e.featured" class="ml-2 text-[10px] uppercase tracking-widest text-gold-500 border border-gold-500/40 px-1.5 py-0.5">Featured</span>
              </p>
              <NuxtLink :to="`/admin/equipment/${e.id}`" class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors">Edit item</NuxtLink>
            </li>
          </ul>
        </div>
        <p v-if="!active.length" class="p-8 text-center text-sm text-bone-400">
          No categories yet. Add the first one.
        </p>
      </div>

      <template v-if="archived.length">
        <h2 class="mt-10 text-sm font-heading font-semibold uppercase tracking-widest text-bone-400">Archived</h2>
        <div class="mt-3 border border-ink-800 divide-y divide-ink-800 opacity-70">
          <div v-for="c in archived" :key="c.id" class="flex items-center gap-4 p-4">
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-bone-100 truncate">{{ c.name.is }} <span class="text-bone-400 font-normal">· {{ c.name.en }}</span></p>
              <p class="mt-0.5 text-xs text-bone-400 font-mono truncate">/equipment/{{ c.slug.is }}</p>
            </div>
            <NuxtLink :to="`/admin/equipment/categories/${c.id}`" class="btn-ghost !px-4 !py-2 !text-xs">Edit</NuxtLink>
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

useHead({ title: 'Equipment categories · Admin' })
</script>
