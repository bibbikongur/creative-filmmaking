<template>
  <!-- Catalogue list view: one compact line per item (thumbnail, name, summary, add).
       Reads like a rental list for people who already know what they are after. -->
  <article
    v-if="row"
    v-bind="$attrs"
    class="group relative flex items-center gap-3 sm:gap-5 py-2.5 pl-2.5 pr-2.5 sm:pr-3 transition-colors hover:bg-ink-800/70"
    :class="[focusRing, inCart ? 'bg-gold-500/[0.07] shadow-[inset_2px_0_0_0_theme(colors.gold.500)]' : '']"
  >
    <div class="relative shrink-0 w-14 h-14 sm:w-20 sm:h-[3.75rem] overflow-hidden" :class="item.images.length ? 'bg-bone-100' : 'bg-ink-900'">
      <NuxtImg
        v-if="item.images.length"
        :src="item.images[0]!"
        :provider="imgProvider(item.images[0]!)"
        :alt="lt(item.name)"
        class="w-full h-full object-contain p-0.5 mix-blend-multiply"
        sizes="80px"
        format="webp"
        loading="lazy"
      />
      <ImagePlaceholder v-else />
    </div>

    <div class="min-w-0 flex-1">
      <p v-if="categoryLabel" class="mb-0.5 text-[11px] uppercase tracking-widest text-bone-400 truncate">{{ categoryLabel }}</p>
      <h3 class="font-heading font-medium uppercase tracking-wide text-sm sm:text-[15px] leading-snug text-bone-100 hyphens-manual [overflow-wrap:break-word]">
        <NuxtLink
          :to="to"
          class="after:absolute after:inset-0 after:content-[''] underline-offset-4 decoration-ink-400 decoration-1 [@media(hover:hover)]:group-hover:underline focus-visible:outline-none"
        >
          {{ softHyphenate(keepUnits(name.main)) }}
        </NuxtLink>
        <span v-if="name.detail" class="ml-2 font-sans text-xs font-normal normal-case tracking-normal text-bone-400 whitespace-nowrap max-sm:hidden">{{ name.detail }}</span>
      </h3>
      <!-- Specs as separate pieces in a one-line-high box: a piece that does not fit
           drops out whole, so the line never ends on half a phrase. Phones stack two. -->
      <ul v-if="rowSpecs.length" class="mt-0.5 md:flex md:flex-wrap md:gap-x-2 md:overflow-hidden text-[13px] leading-[1.125rem] text-bone-400 md:max-h-[1.125rem]">
        <!-- Below md: the model (phones) and the first spec, in full (it may take two lines) -->
        <li
          v-for="(spec, n) in rowSpecs"
          :key="n"
          class="max-w-full md:truncate"
          :class="[spec.model ? 'sm:hidden text-bone-100/80' : '', n > firstDesktopSpec ? 'max-md:hidden' : '']"
        >
          <span v-if="n > firstDesktopSpec" class="max-md:hidden mr-2 text-ink-500" aria-hidden="true">·</span>{{ spec.text }}
        </li>
      </ul>
    </div>

    <span v-if="inCart" class="hidden min-[1600px]:inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gold-400">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
      </svg>
      {{ t('cart.added') }}
    </span>
    <AddToCartButton type="equipment" :id="item.id" compact icon-only-mobile class="relative z-10 shrink-0 sm:w-[8.25rem] sm:!px-0" />
  </article>

  <!-- Card. Same shell as VehicleCard: stretched title link, interactive children at z-10.
       `dense` is the catalogue size: four to a row on a desktop, two on a phone. Its
       parts are four rows (photo, name, spec, action); a parent grid can make cards
       share them by passing "grid-rows-subgrid row-span-4", so a row of cards lines
       up without any reserved empty space. -->
  <article
    v-else
    v-bind="$attrs"
    class="group relative bg-ink-800 transition-shadow duration-200"
    @touchstart.passive="swipeStart"
    @touchend.passive="swipeEnd"
    :class="dense
      ? ['grid grid-cols-1 grid-rows-[auto_auto_1fr_auto] gap-y-0 min-w-0', focusRing, 'ring-1', inCart ? 'ring-2 ring-gold-500' : 'ring-ink-700/70 [@media(hover:hover)]:hover:ring-ink-400']
      : 'flex flex-col border-t-2 border-transparent hover:border-gold-500 focus-within:border-gold-500 transition-colors'"
  >
    <!-- Image. Equipment photos are opaque white manufacturer cutouts, so they live in a
         deliberate white "product well" (shared with the detail gallery) rather than fighting
         the dark stage. A photograph among them (found by looking at its corners once it
         has loaded) fills the frame instead of floating in the well. -->
    <div
      ref="well"
      class="relative overflow-hidden"
      :class="[item.images.length ? (dense ? 'bg-bone-100' : 'bg-product-well') : 'bg-ink-900', dense ? 'aspect-[3/2]' : 'aspect-card']"
    >
      <NuxtImg
        v-if="item.images.length"
        :key="active"
        :src="item.images[active]!"
        :provider="imgProvider(item.images[active]!)"
        :alt="lt(item.name)"
        class="w-full h-full transition-transform duration-500 motion-safe:group-hover:scale-105"
        :class="photo ? 'object-cover' : (dense ? 'object-contain p-2.5 mix-blend-multiply' : 'object-contain p-4')"
        :sizes="sizes"
        format="webp"
        loading="lazy"
        data-probe
        @load="probe"
      />
      <ImagePlaceholder v-else />
      <span v-if="categoryLabel && !dense" class="absolute top-3 left-3 px-2.5 py-1 bg-ink-950/70 backdrop-blur text-gold-400 text-[11px] uppercase tracking-widest font-semibold">
        {{ categoryLabel }}
      </span>

      <span v-if="dense && inCart" class="absolute top-0 left-0 inline-flex items-center gap-1.5 px-2 py-1 bg-gold-500 text-ink-950 text-[11px] font-semibold uppercase tracking-wider">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
        </svg>
        {{ t('cart.added') }}
      </span>

      <!-- Prev / next + dots when there is more than one photo. Arrows are always visible
           on touch screens (no hover there) and appear on hover/focus elsewhere. The dense
           card gets slim ones at the very edge so they do not sit on the product, and a
           sideways swipe anywhere on the card does the same. -->
      <template v-if="gallery && item.images.length > 1">
        <button
          type="button"
          class="absolute z-10 top-1/2 -translate-y-1/2 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 hover:bg-ink-950/80 transition md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          :class="dense ? 'left-0 px-1 py-3 sm:px-1.5' : 'left-2 p-2.5'"
          :aria-label="t('common.prevImage')"
          @click.stop="step(-1)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          class="absolute z-10 top-1/2 -translate-y-1/2 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 hover:bg-ink-950/80 transition md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          :class="dense ? 'right-0 px-1 py-3 sm:px-1.5' : 'right-2 p-2.5'"
          :aria-label="t('common.nextImage')"
          @click.stop="step(1)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div v-if="dense" class="absolute z-10 bottom-0 left-1/2 -translate-x-1/2 flex">
          <button
            v-for="(_, i) in item.images"
            :key="i"
            type="button"
            class="px-1 py-2"
            :aria-label="t('common.imageN', { n: i + 1 })"
            :aria-current="i === active ? 'true' : undefined"
            @click.stop="active = i"
          >
            <span class="block w-1.5 h-1.5 rounded-full transition-colors" :class="i === active ? 'bg-ink-950' : 'bg-ink-950/25 hover:bg-ink-950/50'" />
          </button>
        </div>
        <div v-else class="absolute z-10 bottom-1 left-1/2 -translate-x-1/2 flex">
          <button
            v-for="(_, i) in item.images"
            :key="i"
            type="button"
            class="p-1.5"
            :aria-label="t('common.imageN', { n: i + 1 })"
            :aria-current="i === active ? 'true' : undefined"
            @click.stop="active = i"
          >
            <span
              class="block w-2 h-2 rounded-full ring-1 ring-ink-950/40 transition-colors"
              :class="i === active ? 'bg-gold-400' : 'bg-bone-100/70 hover:bg-bone-100'"
            />
          </button>
        </div>
      </template>
    </div>

    <!-- Body -->
    <div :class="dense ? 'contents' : 'flex-1 flex flex-col p-5'">
      <template v-if="dense">
        <div class="px-3 pt-3 sm:px-4 sm:pt-4">
          <p v-if="categoryLabel" class="mb-1.5 text-[11px] uppercase tracking-widest text-bone-400 truncate">{{ categoryLabel }}</p>
          <h3 class="font-heading font-medium uppercase tracking-wide text-sm sm:text-base leading-snug text-bone-100 line-clamp-2 hyphens-manual [overflow-wrap:break-word]">
            <NuxtLink
              :to="to"
              class="after:absolute after:inset-0 after:content-[''] underline-offset-4 decoration-ink-400 decoration-1 [@media(hover:hover)]:group-hover:underline focus-visible:outline-none"
            >
              {{ softHyphenate(keepUnits(name.main)) }}
            </NuxtLink>
          </h3>
          <p v-if="name.detail" class="mt-1 text-xs text-bone-400 truncate">{{ name.detail }}</p>
        </div>
        <!-- The row may be taller than the text (shared rows), so the clamp sits on an inner element -->
        <div class="px-3 sm:px-4 pt-2">
          <p class="text-[13px] leading-snug text-bone-400 line-clamp-2">{{ specs[0] }}</p>
        </div>

        <div class="px-3 pb-3 sm:px-4 sm:pb-4 pt-3">
          <p v-if="priceNote" class="mb-2 text-[11px] uppercase tracking-widest text-bone-400">{{ t('equipmentCatalogue.browser.priceNote') }}</p>
          <AddToCartButton type="equipment" :id="item.id" compact block :primary="primary" :accent="accent" class="relative z-10" />
        </div>
      </template>
      <template v-else>
        <h3 class="h3">
          <NuxtLink
            :to="to"
            class="after:absolute after:inset-0 after:content-[''] group-hover:text-gold-400 transition-colors focus-visible:outline-none"
          >
            {{ lt(item.name) }}
          </NuxtLink>
        </h3>
        <p class="mt-2 text-sm text-bone-400 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {{ lt(item.tagline) }}
        </p>
      </template>

      <div v-if="!dense" class="mt-auto pt-4 border-t border-ink-700 flex items-center justify-between gap-3">
        <span class="text-sm font-heading font-semibold uppercase tracking-wider text-gold-500 group-hover:text-gold-400 transition-colors flex items-center gap-2">
          {{ t('common.viewDetails') }}
          <svg class="w-4 h-4 transition-transform motion-safe:group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
        <AddToCartButton type="equipment" :id="item.id" compact class="relative z-10" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
// Two root branches with comments between them: the caller's classes (grid row
// sharing, widths in a sideways row) are bound to whichever article renders.
defineOptions({ inheritAttrs: false })

import type { EquipmentItem } from '~/types'

const props = withDefaults(defineProps<{
  item: EquipmentItem
  /** Category name: a badge on the photo, or a quiet line above the name when dense / row */
  categoryLabel?: string
  /** @nuxt/image sizes string matching the grid the card sits in */
  sizes?: string
  /** "row" is the one-line catalogue list view */
  layout?: 'grid' | 'row'
  /** Catalogue density: smaller type, 4:3 photo, full-width add button */
  dense?: boolean
  /** Filled gold add button (a short featured row); the catalogue grid keeps the outline */
  primary?: boolean
  /** Outline add button with an amber plus that fills on hover (teaser rows) */
  accent?: boolean
  /** Photo browsing on the card (arrows, dots, swipe). Off on teaser rows. */
  gallery?: boolean
  /** The "price on request" line above the button (dense); off where the page already says it once */
  priceNote?: boolean
}>(), {
  priceNote: true,
  categoryLabel: '',
  sizes: 'xs:100vw sm:50vw md:33vw',
  layout: 'grid',
  dense: false,
  gallery: true,
})

const row = computed(() => props.layout === 'row')

const { t } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()

const { equipmentPath } = useItemPaths()
const to = computed(() => equipmentPath(props.item))

const cart = useCart()
const inCart = computed(() => cart.has('equipment', props.item.id))

// "Olíuhitablásari 21 kW (Master BV 77 E)" → the name, and the bracketed model
// or pack size as a quiet second line, so names stay short in a narrow card.
const name = computed(() => splitEquipmentName(lt(props.item.name)))

// Highlights are short, spec-like lines ("21 kW, um 19 klst. á tankfylli"),
// which compare better at card size than a clipped sentence of the tagline.
const specs = computed(() => {
  const list = (props.item.highlights ?? []).map(h => lt(h)).filter(Boolean)
  return list.length ? list : [lt(props.item.tagline)].filter(Boolean)
})
// List row: the model leads on phones (where it is not beside the name), then up to three specs.
const rowSpecs = computed(() => [
  ...(name.value.detail ? [{ text: name.value.detail, model: true }] : []),
  ...specs.value.slice(0, 3).map(text => ({ text, model: false })),
])
const firstDesktopSpec = computed(() => (name.value.detail ? 1 : 0))

// The title link covers the whole card, so the card itself shows keyboard focus.
const focusRing = '[&:has(a:focus-visible)]:outline [&:has(a:focus-visible)]:outline-2 [&:has(a:focus-visible)]:outline-offset-2 [&:has(a:focus-visible)]:outline-gold-400'

const active = ref(0)

// Cut-out on white, or a photograph that should fill the frame? Read off the
// loaded image (utils/imageKind.ts); a cut-out until then.
const well = ref<HTMLElement | null>(null)
const photo = ref(false)
const probe = () => {
  const img = well.value?.querySelector<HTMLImageElement>('img[data-probe]')
  if (img) photo.value = isFramePhotograph(img)
}
// An image that finished loading before the page came alive never fires "load" here.
onMounted(() => nextTick(probe))

// Sideways swipe on a card with several photos: next / previous photo.
let swipeX = 0
let swipeY = 0
const swipeStart = (e: TouchEvent) => {
  swipeX = e.touches[0]?.clientX ?? 0
  swipeY = e.touches[0]?.clientY ?? 0
}
const swipeEnd = (e: TouchEvent) => {
  if (row.value || !props.gallery || props.item.images.length < 2) return
  const dx = (e.changedTouches[0]?.clientX ?? 0) - swipeX
  const dy = (e.changedTouches[0]?.clientY ?? 0) - swipeY
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1)
}

const step = (dir: number) => {
  active.value = (active.value + dir + props.item.images.length) % props.item.images.length
}
</script>
