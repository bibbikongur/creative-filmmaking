<template>
  <!-- "No photo yet" glyph, centred in whatever box it is given -->
  <div class="w-full h-full flex items-center justify-center bg-ink-900" aria-hidden="true">
    <svg :class="iconClass" class="text-bone-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ iconClass?: string }>(), { iconClass: 'w-8 h-8' })
</script>
