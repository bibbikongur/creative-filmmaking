<template>
  <div :class="center ? 'text-center' : ''">
    <p class="kicker">{{ kicker }}</p>
    <component :is="as" class="mt-3" :class="as === 'h1' ? 'h1' : 'h2'">
      {{ title }}
    </component>
    <p v-if="intro" class="mt-4 max-w-2xl text-bone-400 leading-relaxed" :class="center ? 'mx-auto' : ''">
      {{ intro }}
    </p>
  </div>
</template>

<script setup lang="ts">
// `as="h1"` on the page's top heading — every page needs exactly one h1 for
// SEO; secondary section headings stay h2 (and render one step smaller).
withDefaults(defineProps<{
  kicker: string
  title: string
  intro?: string
  center?: boolean
  as?: 'h1' | 'h2'
}>(), {
  intro: '',
  center: false,
  as: 'h2',
})
</script>
