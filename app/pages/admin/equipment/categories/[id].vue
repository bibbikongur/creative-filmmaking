<template>
  <div>
    <AdminStateMessage v-if="!loaded" kind="loading">Loading…</AdminStateMessage>
    <AdminStateMessage v-else-if="!category" kind="error" title="Category not found">
      It may have been deleted.
      <template #action>
        <NuxtLink to="/admin/equipment/categories" class="btn-outline btn-sm">Back to categories</NuxtLink>
      </template>
    </AdminStateMessage>
    <template v-else>
      <AdminPageHeader
        :title="category.name.en || category.name.is"
        :crumbs="[{ label: 'Catalogue' }, { label: 'Equipment', to: '/admin/equipment' }, { label: 'Categories', to: '/admin/equipment/categories' }, { label: 'Edit' }]"
      >
        <template #actions>
          <a v-if="category.status === 'active'" :href="`/equipment/${category.slug.is}`" target="_blank" rel="noopener" class="btn-outline btn-sm">View on website <AdminIcon name="external" :size="16" /></a>
        </template>
      </AdminPageHeader>
      <div class="mt-6 space-y-5">
        <AdminEquipmentCategoryForm :category="category" :saving="saving" :error="error" @save="save" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { EquipmentCategoryDef } from '~/types'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const category = ref<EquipmentCategoryDef>()
const loaded = ref(false)
const saving = ref(false)
const error = ref<string | string[]>('')

onMounted(async () => {
  try {
    const all = await $fetch<EquipmentCategoryDef[]>('/api/admin/equipment-categories', { query: { t: Date.now() } })
    category.value = all.find(c => c.id === route.params.id)
  }
  finally {
    loaded.value = true
  }
})

const save = async (payload: Record<string, unknown>) => {
  saving.value = true
  error.value = ''
  try {
    await $fetch(`/api/admin/equipment-categories/${route.params.id}`, { method: 'PUT', body: payload })
    clearNuxtData('equipment-categories')
    clearNuxtData('equipment')
    await navigateTo('/admin/equipment/categories')
  }
  catch (e: any) {
    error.value = e?.data?.data?.errors || e?.data?.statusMessage || 'Save failed. Please try again.'
  }
  finally {
    saving.value = false
  }
}

useHead({ title: 'Edit category · Admin · Creative Filmmaking' })
</script>
