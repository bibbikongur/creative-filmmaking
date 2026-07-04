<template>
  <div>
    <NuxtLink to="/admin/equipment" class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors">← Equipment</NuxtLink>

    <p v-if="!loaded" class="mt-8 text-sm text-bone-400">Loading…</p>
    <div v-else-if="!item" class="mt-8 text-sm text-signal-500">
      Item not found — it may have been deleted.
    </div>
    <template v-else>
      <h1 class="mt-3 text-3xl font-semibold uppercase tracking-wide text-bone-100">
        Edit · {{ item.name.en }}
      </h1>
      <div class="mt-8">
        <AdminEquipmentForm :item="item" :saving="saving" :error="error" @save="save" />
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
    error.value = e?.data?.data?.errors || e?.data?.statusMessage || 'Save failed — please try again.'
  }
  finally {
    saving.value = false
  }
}

useHead({ title: 'Edit equipment · Admin' })
</script>
