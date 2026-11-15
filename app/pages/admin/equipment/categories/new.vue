<template>
  <div>
    <AdminPageHeader title="Add category" description="A new category gets its own page on the website." :crumbs="[{ label: 'Catalogue' }, { label: 'Equipment', to: '/admin/equipment' }, { label: 'Categories', to: '/admin/equipment/categories' }, { label: 'Add' }]" />
    <div class="mt-6">
      <AdminEquipmentCategoryForm :saving="saving" :error="error" @save="save" />
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
    await $fetch('/api/admin/equipment-categories', { method: 'POST', body: payload })
    clearNuxtData('equipment-categories')
    await navigateTo('/admin/equipment/categories')
  }
  catch (e: any) {
    error.value = e?.data?.data?.errors || e?.data?.statusMessage || 'Save failed. Please try again.'
  }
  finally {
    saving.value = false
  }
}

useHead({ title: 'New category · Admin · Creative Filmmaking' })
</script>
