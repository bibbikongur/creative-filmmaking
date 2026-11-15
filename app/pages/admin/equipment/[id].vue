<template>
  <div>
    <AdminStateMessage v-if="!loaded" kind="loading">Loading…</AdminStateMessage>
    <AdminStateMessage v-else-if="!item" kind="error" title="Item not found">
      It may have been deleted.
      <template #action>
        <NuxtLink to="/admin/equipment" class="btn-outline btn-sm">Back to equipment</NuxtLink>
      </template>
    </AdminStateMessage>
    <template v-else>
      <AdminPageHeader
        :title="item.name.en || item.name.is"
        :crumbs="[{ label: 'Catalogue' }, { label: 'Equipment', to: '/admin/equipment' }, { label: 'Edit' }]"
      >
        <template #actions>
          <a :href="`/equipment/${equipmentSlug(item)}`" target="_blank" rel="noopener" class="btn-outline btn-sm">View on website <AdminIcon name="external" :size="16" /></a>
        </template>
      </AdminPageHeader>
      <div class="mt-6 space-y-5">
        <AdminItemRentalStats item-type="equipment" :item-id="item.id" />
        <AdminEquipmentForm :item="item" :saving="saving" :error="error" @save="save" @delete="remove" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { EquipmentItem } from '~/types'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const item = ref<EquipmentItem>()
const loaded = ref(false)
const saving = ref(false)
const error = ref<string | string[]>('')

onMounted(async () => {
  try {
    const all = await $fetch<EquipmentItem[]>('/api/equipment', { query: { t: Date.now() } })
    item.value = all.find(e => e.id === route.params.id)
  }
  finally {
    loaded.value = true
  }
})

const save = async (payload: Record<string, unknown>) => {
  saving.value = true
  error.value = ''
  try {
    await $fetch(`/api/admin/equipment/${route.params.id}`, { method: 'PUT', body: payload })
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

const { confirmDialog, alertDialog } = useAppDialog()
const remove = async () => {
  if (!item.value) return
  if (!await confirmDialog(`Delete "${item.value.name.en}"? This removes it from the website immediately.`)) return
  try {
    await $fetch(`/api/admin/equipment/${item.value.id}`, { method: 'DELETE' })
    clearNuxtData('equipment')
    await navigateTo('/admin/equipment')
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || 'Delete failed.')
  }
}

useHead({ title: 'Edit equipment · Admin · Creative Filmmaking' })
</script>
