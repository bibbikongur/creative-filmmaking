<template>
  <div :class="center ? 'text-center' : ''">
    <p class="kicker">{{ kicker }}</p>
    <h2 class="mt-3 text-3xl sm:text-4xl font-semibold uppercase tracking-wide text-bone-100">
      {{ title }}
    </h2>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ kicker: string; title: string; center?: boolean }>(), {
  center: false,
})
</script>
