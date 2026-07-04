<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="kicker">Equipment</p>
        <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">Manage equipment</h1>
      </div>
      <NuxtLink to="/admin/equipment/new" class="btn-gold !px-5 !py-2.5">+ Add equipment</NuxtLink>
    </div>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="mt-8 text-sm text-bone-400">Loading equipment…</p>

    <div v-else class="mt-8 border border-ink-800 divide-y divide-ink-800">
      <div
        v-for="e in items"
        :key="e.id"
        class="flex items-center gap-4 p-4 bg-ink-900/50 hover:bg-ink-900 transition-colors"
      >
        <img
          :src="e.images[0]"
          :alt="e.name.en"
          class="w-20 h-14 object-cover bg-ink-800 shrink-0"
          loading="lazy"
        >
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-bone-100 truncate">{{ e.name.en }}</p>
          <p class="mt-0.5 text-xs uppercase tracking-widest text-bone-400">{{ e.category }}</p>
        </div>
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

      <p v-if="!items.length" class="p-8 text-center text-sm text-bone-400">
        No equipment yet — add the first item.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EquipmentItem } from '~/types'

definePageMeta({ layout: 'admin' })

const items = ref<EquipmentItem[]>([])
const loaded = ref(false)
const loadError = ref('')
const deleting = ref('')

const load = async () => {
  loadError.value = ''
  try {
    items.value = await $fetch<EquipmentItem[]>('/api/equipment', {
      query: { t: Date.now() }, // bypass any intermediary cache
    })
    loaded.value = true
  }
  catch {
    loadError.value = 'Could not load equipment — is the server running?'
  }
}

onMounted(load)

const remove = async (e: EquipmentItem) => {
  if (!confirm(`Delete "${e.name.en}"? This removes it from the website immediately.`)) return
  deleting.value = e.id
  try {
    await $fetch(`/api/admin/equipment/${e.id}`, { method: 'DELETE' })
    items.value = items.value.filter(x => x.id !== e.id)
    clearNuxtData('equipment') // public pages refetch on next visit
  }
  catch (err: any) {
    alert(err?.data?.statusMessage || 'Delete failed.')
  }
  finally {
    deleting.value = ''
  }
}

useHead({ title: 'Equipment · Admin' })
</script>
