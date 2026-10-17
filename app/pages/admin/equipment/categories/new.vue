<template>
  <div>
    <NuxtLink to="/admin/equipment/categories" class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors">← Categories</NuxtLink>
    <h1 class="mt-3 text-3xl font-semibold uppercase tracking-wide text-bone-100">New category</h1>
    <div class="mt-8">
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

useHead({ title: 'New category · Admin' })
</script>
