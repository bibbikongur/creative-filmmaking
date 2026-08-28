<template>
  <div :class="center ? 'text-center' : ''">
    <p class="kicker">{{ kicker }}</p>
    <component :is="as" class="mt-3 text-3xl sm:text-4xl font-semibold uppercase tracking-wide text-bone-100">
      {{ title }}
    </component>
  </div>
</template>

<script setup lang="ts">
// `as="h1"` on the page's top heading — every page needs exactly one h1 for
// SEO; secondary section headings stay h2.
withDefaults(defineProps<{ kicker: string; title: string; center?: boolean; as?: 'h1' | 'h2' }>(), {
  center: false,
  as: 'h2',
})
</script>
