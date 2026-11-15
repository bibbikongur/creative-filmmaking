<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="alt"
    class="object-cover bg-ink-800 shrink-0"
    :class="sizeClass"
    loading="lazy"
    @error="failed = true"
  >
  <div v-else class="flex items-center justify-center border border-dashed border-ink-700 bg-ink-900 shrink-0 text-ink-400" :class="sizeClass" :title="`${alt}: no photo`">
    <AdminIcon :name="icon" :size="size === 'sm' ? 14 : 18" />
  </div>
</template>

<script setup lang="ts">
import type { AdminIconName } from './Icon.vue'

const props = withDefaults(defineProps<{
  src?: string
  alt: string
  size?: 'sm' | 'md'
  icon?: AdminIconName
}>(), { src: '', size: 'md', icon: 'equipment' })

// A broken or deleted file shows the placeholder, never an empty box
const failed = ref(false)
watch(() => props.src, () => { failed.value = false })

const sizeClass = computed(() => (props.size === 'sm' ? 'w-12 h-9' : 'w-16 h-12'))
</script>
