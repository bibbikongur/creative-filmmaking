<template>
  <div>
    <AdminPageHeader title="Add vehicle" description="It appears on the website as soon as you create it." :crumbs="[{ label: 'Catalogue' }, { label: 'Vehicles', to: '/admin/vehicles' }, { label: 'Add' }]" />
    <div class="mt-6">
      <AdminVehicleForm :saving="saving" :error="error" @save="save" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const saving = ref(false)
const error = ref<string | string[]>('')

const save = async (payload: Record<string, unknown>) => {
  saving.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/vehicles', { method: 'POST', body: payload })
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

useHead({ title: 'Add vehicle · Admin · Creative Filmmaking' })
</script>
