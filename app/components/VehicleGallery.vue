<template>
  <div>
    <!-- Main image. Equipment ("contain") sits in the same white product well as its card. -->
    <div class="relative overflow-hidden aspect-card" :class="fit === 'contain' ? 'bg-product-well' : 'bg-ink-800'">
      <button
        v-if="images.length"
        type="button"
        class="block w-full h-full cursor-zoom-in"
        :aria-label="t('common.openLightbox')"
        @click="lightbox = active"
      >
        <NuxtImg
          :key="active"
          :src="images[active]!"
          :provider="imgProvider(images[active]!)"
          :alt="`${alt} (${active + 1}/${images.length})`"
          class="w-full h-full"
          :class="fit === 'contain' ? 'object-contain p-4' : 'object-cover'"
          sizes="xs:100vw lg:60vw"
          format="webp"
          :preload="active === 0"
        />
      </button>
      <ImagePlaceholder v-else icon-class="w-10 h-10" />

      <!-- Prev / next -->
      <template v-if="images.length > 1">
        <button
          type="button"
          class="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 transition-colors"
          :aria-label="t('common.prevImage')"
          @click="step(-1)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 transition-colors"
          :aria-label="t('common.nextImage')"
          @click="step(1)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span class="absolute bottom-3 right-3 px-2 py-1 bg-ink-950/60 backdrop-blur meta text-bone-400 tabular-nums">
          {{ active + 1 }} / {{ images.length }}
        </span>
      </template>
    </div>

    <!-- Thumbnails -->
    <div v-if="images.length > 1" class="mt-3 grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
      <button
        v-for="(image, i) in images"
        :key="image"
        type="button"
        class="relative overflow-hidden aspect-card ring-1 transition-all"
        :class="[
          i === active ? 'ring-gold-500' : 'ring-ink-700 opacity-60 hover:opacity-100',
          fit === 'contain' ? 'bg-product-well' : 'bg-ink-800',
        ]"
        :aria-label="t('common.imageN', { n: i + 1 })"
        :aria-pressed="i === active"
        @click="active = i"
      >
        <NuxtImg
          :src="image"
          :provider="imgProvider(image)"
          :alt="`${alt} (${i + 1})`"
          class="w-full h-full"
          :class="fit === 'contain' ? 'object-contain p-1' : 'object-cover'"
          sizes="120px"
          format="webp"
          loading="lazy"
        />
      </button>
    </div>

    <Lightbox v-if="images.length" v-model:index="lightbox" :images="images" :alt="alt" :fit="fit" />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ images: string[]; alt: string; fit?: 'cover' | 'contain' }>(), {
  fit: 'cover',
})

const { t } = useI18n()
const active = ref(0)
const lightbox = ref<number | null>(null)

const step = (dir: number) => {
  active.value = (active.value + dir + props.images.length) % props.images.length
}
</script>
