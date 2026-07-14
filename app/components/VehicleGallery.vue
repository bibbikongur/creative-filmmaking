<template>
  <div>
    <!-- Main image -->
    <div class="relative overflow-hidden aspect-card bg-ink-800">
      <NuxtImg
        :key="active"
        :src="images[active]"
        :provider="imgProvider(images[active])"
        :alt="`${alt} (${active + 1}/${images.length})`"
        class="w-full h-full object-cover"
        sizes="sm:100vw lg:60vw"
        :preload="active === 0"
      />
      <!-- Prev / next -->
      <template v-if="images.length > 1">
        <button
          type="button"
          class="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 transition-colors"
          aria-label="Previous image"
          @click="step(-1)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 transition-colors"
          aria-label="Next image"
          @click="step(1)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span class="absolute bottom-3 right-3 px-2 py-1 bg-ink-950/60 backdrop-blur text-xs text-bone-400 tracking-widest">
          {{ active + 1 }} / {{ images.length }}
        </span>
      </template>
    </div>

    <!-- Thumbnails -->
    <div v-if="images.length > 1" class="mt-3 grid grid-cols-5 gap-3">
      <button
        v-for="(image, i) in images"
        :key="image"
        type="button"
        class="relative overflow-hidden aspect-card ring-1 transition-all"
        :class="i === active ? 'ring-gold-500' : 'ring-ink-700 opacity-60 hover:opacity-100'"
        :aria-label="`Image ${i + 1}`"
        @click="active = i"
      >
        <NuxtImg :src="image" :provider="imgProvider(image)" :alt="''" class="w-full h-full object-cover" sizes="120px" loading="lazy" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ images: string[]; alt: string }>()

const active = ref(0)

const step = (dir: number) => {
  active.value = (active.value + dir + props.images.length) % props.images.length
}
</script>
