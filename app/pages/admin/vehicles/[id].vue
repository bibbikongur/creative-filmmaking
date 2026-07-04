<template>
  <div>
    <NuxtLink to="/admin" class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors">← Fleet</NuxtLink>

    <p v-if="!loaded" class="mt-8 text-sm text-bone-400">Loading…</p>
    <div v-else-if="!vehicle" class="mt-8 text-sm text-signal-500">
      Vehicle not found. It may have been deleted.
    </div>
    <template v-else>
      <h1 class="mt-3 text-3xl font-semibold uppercase tracking-wide text-bone-100">
        Edit · {{ vehicle.name.en }}
      </h1>
      <div class="mt-8">
        <AdminVehicleForm :vehicle="vehicle" :saving="saving" :error="error" @save="save" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/types'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const vehicle = ref<Vehicle>()
const loaded = ref(false)
const saving = ref(false)
const error = ref<string | string[]>('')

onMounted(async () => {
  try {
    const all = await $fetch<Vehicle[]>('/api/vehicles', { query: { t: Date.now() } })
    vehicle.value = all.find(v => v.id === route.params.id)
  }
  finally {
    loaded.value = true
  }
})

const save = async (payload: Record<string, unknown>) => {
  saving.value = true
  error.value = ''
  try {
    await $fetch(`/api/admin/vehicles/${route.params.id}`, { method: 'PUT', body: payload })
    clearNuxtData('fleet')
    await navigateTo('/admin')
  }
  catch (e: any) {
    error.value = e?.data?.data?.errors || e?.data?.statusMessage || 'Save failed. Please try again.'
  }
  finally {
    saving.value = false
  }
}

useHead({ title: 'Edit vehicle · Admin' })
</script>
