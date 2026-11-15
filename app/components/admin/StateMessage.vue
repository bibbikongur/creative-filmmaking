<template>
  <!-- Loading, error and empty states share one frame so pages do not jump between them -->
  <div
    class="admin-card px-6 py-12 text-center text-sm"
    :class="kind === 'error' ? '!border-signal-500/40 text-signal-400' : 'text-bone-400'"
    :role="kind === 'error' ? 'alert' : 'status'"
  >
    <p v-if="title" class="mb-1.5 font-semibold text-bone-100">{{ title }}</p>
    <p class="mx-auto max-w-md leading-relaxed"><slot /></p>
    <div v-if="$slots.action" class="mt-5 flex justify-center gap-3">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ kind?: 'loading' | 'error' | 'empty', title?: string }>(), { kind: 'empty', title: '' })
</script>
