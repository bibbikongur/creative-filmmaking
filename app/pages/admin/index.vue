<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="kicker">Fleet</p>
        <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">Manage vehicles</h1>
      </div>
      <NuxtLink to="/admin/vehicles/new" class="btn-gold !px-5 !py-2.5">+ Add vehicle</NuxtLink>
    </div>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="mt-8 text-sm text-bone-400">Loading fleet…</p>

    <div v-else class="mt-8 border border-ink-800 divide-y divide-ink-800">
      <div
        v-for="v in vehicles"
        :key="v.id"
        class="flex items-center gap-4 p-4 bg-ink-900/50 hover:bg-ink-900 transition-colors"
      >
        <img
          :src="v.images[0]"
          :alt="v.name.en"
          class="w-20 h-14 object-cover bg-ink-800 shrink-0"
          loading="lazy"
        >
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-bone-100 truncate">
            {{ v.name.en }}
            <span v-if="v.featured" class="ml-2 text-[10px] uppercase tracking-widest text-gold-500 border border-gold-500/40 px-1.5 py-0.5">Featured</span>
          </p>
          <p class="mt-0.5 text-xs uppercase tracking-widest text-bone-400">
            {{ v.category }} · <span class="normal-case tracking-normal">/vehicles/{{ v.slug }}</span>
          </p>
        </div>
        <a :href="`/vehicles/${v.slug}`" target="_blank" class="text-xs text-bone-400 hover:text-gold-400 transition-colors hidden sm:block">View ↗</a>
        <NuxtLink :to="`/admin/vehicles/${v.id}`" class="btn-ghost !px-4 !py-2 !text-xs">Edit</NuxtLink>
        <button
          type="button"
          class="text-xs uppercase tracking-widest text-signal-500/80 hover:text-signal-500 transition-colors disabled:opacity-50"
          :disabled="deleting === v.id"
          @click="remove(v)"
        >
          {{ deleting === v.id ? '…' : 'Delete' }}
        </button>
      </div>

      <p v-if="!vehicles.length" class="p-8 text-center text-sm text-bone-400">
        No vehicles yet — add the first one.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/types'

definePageMeta({ layout: 'admin' })

const vehicles = ref<Vehicle[]>([])
const loaded = ref(false)
const loadError = ref('')
const deleting = ref('')

const load = async () => {
  loadError.value = ''
  try {
    vehicles.value = await $fetch<Vehicle[]>('/api/vehicles', {
      query: { t: Date.now() }, // bypass any intermediary cache
    })
    loaded.value = true
  }
  catch {
    loadError.value = 'Could not load the fleet — is the server running?'
  }
}

onMounted(load)

const remove = async (v: Vehicle) => {
  if (!confirm(`Delete "${v.name.en}"? This removes it from the website immediately.`)) return
  deleting.value = v.id
  try {
    await $fetch(`/api/admin/vehicles/${v.id}`, { method: 'DELETE' })
    vehicles.value = vehicles.value.filter(x => x.id !== v.id)
    clearNuxtData('fleet') // public pages refetch on next visit
  }
  catch (e: any) {
    alert(e?.data?.statusMessage || 'Delete failed.')
  }
  finally {
    deleting.value = ''
  }
}

useHead({ title: 'Admin · Creative Filmmaking' })
</script>
