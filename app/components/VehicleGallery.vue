<template>
  <div ref="root">
    <!-- Main image. Equipment ("contain") sits in the same white product well as its card:
         a cut-out on white is blended into the well (no box within a box), while a
         photograph among the cut-outs fills the frame like a vehicle photo does.
         On phones the picture runs edge to edge and a sideways swipe turns the page. -->
    <div
      class="relative overflow-hidden aspect-[3/2] max-sm:-mx-4"
      :class="cutout(active) ? 'bg-product-well' : 'bg-ink-800'"
      @touchstart.passive="swipeStart"
      @touchend.passive="swipeEnd"
    >
      <button
        v-if="images.length"
        type="button"
        class="group/zoom block w-full h-full cursor-zoom-in"
        :aria-label="t('common.openLightbox')"
        @click="lightbox = active"
      >
        <NuxtImg
          :key="active"
          :src="images[active]!"
          :provider="imgProvider(images[active]!)"
          :alt="images.length > 1 ? `${alt} (${active + 1}/${images.length})` : alt"
          class="w-full h-full"
          :class="cutout(active) ? 'object-contain p-5 sm:p-8 mix-blend-multiply' : 'object-cover'"
          :data-probe="active"
          sizes="xs:100vw lg:60vw"
          format="webp"
          @load="probe"
          :fetchpriority="active === 0 ? 'high' : undefined"
        />
        <!-- What a click does: the corner mark says "enlarge" before the pointer gets there -->
        <span class="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center bg-ink-950/70 text-bone-100 transition-colors group-hover/zoom:bg-ink-950 group-hover/zoom:text-gold-400" aria-hidden="true">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
        </span>
      </button>
      <ImagePlaceholder v-else icon-class="w-10 h-10" />

      <!-- Prev / next -->
      <template v-if="images.length > 1">
        <button
          type="button"
          class="absolute left-0 sm:left-3 top-1/2 -translate-y-1/2 h-11 w-11 inline-flex items-center justify-center bg-ink-950/70 text-bone-100 hover:bg-ink-950 hover:text-gold-400 transition-colors"
          :aria-label="t('common.prevImage')"
          @click="step(-1)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          class="absolute right-0 sm:right-3 top-1/2 -translate-y-1/2 h-11 w-11 inline-flex items-center justify-center bg-ink-950/70 text-bone-100 hover:bg-ink-950 hover:text-gold-400 transition-colors"
          :aria-label="t('common.nextImage')"
          @click="step(1)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span class="absolute bottom-3 right-3 px-2.5 py-1 bg-ink-950/75 text-bone-100 text-xs font-medium tabular-nums" aria-hidden="true">
          {{ active + 1 }} / {{ images.length }}
        </span>
      </template>
    </div>

    <!-- Thumbnails: always one row. More photos than fit scroll sideways, the strip
         follows the photo on show, and a fade at either end says there is more that way.
         Photographs are dimmed until chosen; cut-outs on their pale tile stay clean
         (dimmed white reads as dirty grey) and the amber frame alone marks the one on show. -->
    <div v-if="images.length > 1" class="relative mt-2 sm:mt-3 max-sm:-mx-4">
      <div
        ref="strip"
        class="flex gap-2 overflow-x-auto scroll-smooth max-sm:px-4 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        @scroll.passive="measure"
      >
        <button
          v-for="(image, i) in images"
          :key="image"
          type="button"
          class="relative shrink-0 w-[4.5rem] sm:w-24 overflow-hidden aspect-[3/2] transition-opacity"
          :class="[
            i === active ? 'outline outline-2 -outline-offset-2 outline-gold-500' : (cutout(i) ? 'hover:outline hover:outline-1 hover:-outline-offset-1 hover:outline-ink-400' : 'opacity-55 hover:opacity-100 focus-visible:opacity-100'),
            cutout(i) ? 'bg-bone-100' : 'bg-ink-800',
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
            :class="cutout(i) ? 'object-contain p-1 mix-blend-multiply' : 'object-cover'"
            :data-probe="i"
            sizes="120px"
            format="webp"
            loading="lazy"
            @load="probe"
          />
        </button>
      </div>
      <div v-show="more.left" class="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-ink-950 to-transparent" aria-hidden="true" />
      <div v-show="more.right" class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-ink-950 to-transparent" aria-hidden="true" />
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

// Equipment galleries ("contain") mix cut-outs on white with ordinary photographs.
// Which is which is read off each image once it has loaded (utils/imageKind.ts);
// until then every image is taken for a cut-out.
const root = ref<HTMLElement | null>(null)
const photos = reactive(new Set<number>())
const cutout = (i: number) => props.fit === 'contain' && !photos.has(i)
const probeImage = (img: HTMLImageElement) => {
  const i = Number(img.dataset.probe)
  if (props.fit !== 'contain' || Number.isNaN(i) || !img.naturalWidth) return
  if (isFramePhotograph(img)) photos.add(i)
  else photos.delete(i)
}
const probe = (e: Event | string) => {
  if (typeof e !== 'string' && e.target instanceof HTMLImageElement) probeImage(e.target)
}

const step = (dir: number) => {
  active.value = (active.value + dir + props.images.length) % props.images.length
}

// Sideways swipe on the main picture: next / previous photo.
let swipeX = 0
let swipeY = 0
const swipeStart = (e: TouchEvent) => {
  swipeX = e.touches[0]?.clientX ?? 0
  swipeY = e.touches[0]?.clientY ?? 0
}
const swipeEnd = (e: TouchEvent) => {
  if (props.images.length < 2) return
  const dx = (e.changedTouches[0]?.clientX ?? 0) - swipeX
  const dy = (e.changedTouches[0]?.clientY ?? 0) - swipeY
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1)
}

// The thumbnail strip: which ends still hide photos, and keeping the one on show in view.
const strip = ref<HTMLElement | null>(null)
const more = reactive({ left: false, right: false })
const measure = () => {
  const el = strip.value
  if (!el) return
  more.left = el.scrollLeft > 4
  more.right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}
watch(active, async (i) => {
  await nextTick()
  const el = strip.value
  const thumb = el?.children[i] as HTMLElement | undefined
  if (!el || !thumb) return
  // Centre the active thumbnail (scrolling the strip only, never the page).
  el.scrollTo({ left: thumb.offsetLeft - (el.clientWidth - thumb.offsetWidth) / 2 })
})
// The lightbox may have moved on: the page shows the photo it was closed on.
watch(lightbox, (now, before) => {
  if (now === null && before !== null) active.value = before
})

let observer: ResizeObserver | null = null
onMounted(() => {
  // Images that finished loading before the page came alive never fire "load" here.
  root.value?.querySelectorAll<HTMLImageElement>('img[data-probe]').forEach((img) => {
    if (img.complete) probeImage(img)
  })
  measure()
  if (strip.value && 'ResizeObserver' in window) {
    observer = new ResizeObserver(measure)
    observer.observe(strip.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())
</script>
