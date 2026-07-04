<template>
  <div>
    <NuxtLink to="/admin/equipment" class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors">← Equipment</NuxtLink>
    <h1 class="mt-3 text-3xl font-semibold uppercase tracking-wide text-bone-100">Add equipment</h1>
    <div class="mt-8">
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
    error.value = e?.data?.data?.errors || e?.data?.statusMessage || 'Save failed — please try again.'
  }
  finally {
    saving.value = false
  }
}

useHead({ title: 'Add equipment · Admin' })
</script>
