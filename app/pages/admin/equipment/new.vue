<template>
  <div>
    <AdminPageHeader title="Add equipment" description="It appears on the website as soon as you create it." :crumbs="[{ label: 'Catalogue' }, { label: 'Equipment', to: '/admin/equipment' }, { label: 'Add' }]" />
    <div class="mt-6">
      <AdminEquipmentForm :saving="saving" :error="error" @save="save" />
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
    await $fetch('/api/admin/equipment', { method: 'POST', body: payload })
    clearNuxtData('equipment')
    await navigateTo('/admin/equipment')
  }
  catch (e: any) {
    error.value = e?.data?.data?.errors || e?.data?.statusMessage || 'Save failed. Please try again.'
  }
  finally {
    saving.value = false
  }
}

useHead({ title: 'Add equipment · Admin · Creative Filmmaking' })
</script>
