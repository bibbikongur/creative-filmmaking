<template>
  <div>
    <AdminStateMessage v-if="!loaded" kind="loading">Loading…</AdminStateMessage>
    <AdminStateMessage v-else-if="!vehicle" kind="error" title="Vehicle not found">
      It may have been deleted.
      <template #action>
        <NuxtLink to="/admin/vehicles" class="btn-outline btn-sm">Back to vehicles</NuxtLink>
      </template>
    </AdminStateMessage>
    <template v-else>
      <AdminPageHeader
        :title="vehicle.name.en"
        :crumbs="[{ label: 'Catalogue' }, { label: 'Vehicles', to: '/admin/vehicles' }, { label: 'Edit' }]"
      >
        <template #actions>
          <a :href="`/vehicles/${vehicle.slug}`" target="_blank" rel="noopener" class="btn-outline btn-sm">View on website <AdminIcon name="external" :size="16" /></a>
        </template>
      </AdminPageHeader>
      <div class="mt-6 space-y-5">
        <AdminItemRentalStats item-type="vehicle" :item-id="vehicle.id" />
        <AdminVehicleForm :vehicle="vehicle" :saving="saving" :error="error" @save="save" @delete="remove" />
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
    const all = await $fetch<Vehicle[]>('/api/admin/vehicles', { query: { t: Date.now() } })
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
    await navigateTo('/admin/vehicles')
  }
  catch (e: any) {
    error.value = e?.data?.data?.errors || e?.data?.statusMessage || 'Save failed. Please try again.'
  }
  finally {
    saving.value = false
  }
}

const { confirmDialog, alertDialog } = useAppDialog()
const remove = async () => {
  if (!vehicle.value) return
  if (!await confirmDialog(`Delete "${vehicle.value.name.en}"? This removes it from the website immediately.`)) return
  try {
    await $fetch(`/api/admin/vehicles/${vehicle.value.id}`, { method: 'DELETE' })
    clearNuxtData('fleet')
    await navigateTo('/admin/vehicles')
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || 'Delete failed.')
  }
}

useHead({ title: 'Edit vehicle · Admin · Creative Filmmaking' })
</script>
