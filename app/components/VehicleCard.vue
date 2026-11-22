<template>
  <!-- A vehicle as a card (front page, "more like this" on a vehicle page). Same
       language as the equipment card beside it: 3:2 photo, a label, the name, a
       line of facts, the price note and the add button, each in a fixed slot.
       In a grid the slots are shared rows (subgrid), so every card in a row has
       its facts and its button on the same line whatever the name's length. The
       parent opts in by passing "<bp>:grid-rows-subgrid <bp>:row-span-4" from the
       breakpoint where it becomes a grid; outside a grid the card keeps its own rows.
       The title link is stretched over the whole card; controls sit above it. -->
  <article
    ref="card"
    class="group relative min-w-0 bg-ink-800 ring-1 transition-shadow duration-200 grid grid-cols-1 grid-rows-[auto_1fr_auto_auto] gap-y-0"
    :class="[focusRing, inCart ? 'ring-2 ring-gold-500' : 'ring-ink-700/70 [@media(hover:hover)]:hover:ring-ink-400']"
    @touchstart.passive="swipeStart"
    @touchend.passive="swipeEnd"
  >
    <!-- A photograph fills the frame under a light common tone, so phone photos taken
         in different light sit together. A studio cut-out on white (found by looking
         at its corners once it has loaded) goes on the same pale tile as the equipment
         photos instead of glaring as a white box. -->
    <div class="relative overflow-hidden aspect-[3/2]" :class="cutout ? 'bg-bone-100' : 'bg-ink-900'">
      <NuxtImg
        v-if="vehicle.images.length"
        :key="active"
        :src="vehicle.images[active]!"
        :provider="imgProvider(vehicle.images[active]!)"
        :alt="lt(vehicle.name)"
        class="absolute inset-0 w-full h-full"
        :class="cutout ? 'object-contain scale-[1.2] mix-blend-multiply' : 'object-cover saturate-[.85] brightness-[.95] contrast-[1.05]'"
        @load="probe"
        :sizes="sizes"
        format="webp"
        loading="lazy"
      />
      <ImagePlaceholder v-else />

      <span v-if="inCart" class="absolute top-0 left-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gold-500 text-ink-950 text-xs font-semibold uppercase tracking-wider">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
        </svg>
        {{ t('cart.added') }}
      </span>

      <!-- Photo browsing (not on teaser rows). Arrows hide until hover only where a pointer can hover. -->
      <template v-if="gallery && vehicle.images.length > 1">
        <button
          type="button"
          class="absolute z-10 left-0 top-1/2 -translate-y-1/2 h-11 w-9 inline-flex items-center justify-center bg-ink-950/60 text-bone-100 hover:bg-ink-950/85 transition [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:!opacity-100"
          :aria-label="t('common.prevImage')"
          @click.stop="step(-1)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          class="absolute z-10 right-0 top-1/2 -translate-y-1/2 h-11 w-9 inline-flex items-center justify-center bg-ink-950/60 text-bone-100 hover:bg-ink-950/85 transition [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:!opacity-100"
          :aria-label="t('common.nextImage')"
          @click.stop="step(1)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span class="absolute bottom-2 right-2 px-2 py-1 bg-ink-950/75 text-bone-100 text-xs font-medium tabular-nums" aria-hidden="true">
          {{ active + 1 }} / {{ vehicle.images.length }}
        </span>
      </template>
    </div>

    <!-- Slot 2: what it is. Type on every card, the name, then its tags. -->
    <div class="px-4 pt-4">
      <p class="text-xs uppercase tracking-wider text-bone-400">{{ kindLabel }}</p>
      <h3 class="mt-1.5 font-heading font-semibold uppercase tracking-wide text-base lg:max-xl:text-[15px] leading-snug text-bone-100">
        <NuxtLink
          :to="vehiclePath(vehicle)"
          class="after:absolute after:inset-0 after:content-[''] underline-offset-4 decoration-ink-400 decoration-1 [@media(hover:hover)]:group-hover:underline focus-visible:outline-none"
        >
          {{ shortName }}<span v-if="droppedWord" class="sr-only">{{ droppedWord }}</span>
        </NuxtLink>
      </h3>
      <p v-if="tags.length" class="mt-2 flex flex-wrap gap-2">
        <span v-for="tag in tags" :key="tag" class="inline-flex items-center border border-ink-500 px-2 py-0.5 text-xs font-medium text-bone-100 whitespace-nowrap">{{ tag }}</span>
      </p>
    </div>

    <!-- Slot 3: two or three facts on one line; the vehicle page has the table -->
    <!-- One line high in every language and at every width: the facts are separate
         pieces in a box one line tall, and a piece that does not fit drops out whole
         (with its separator), so the line never wraps and never ends mid-fact. -->
    <div class="px-4 pt-3 min-w-0">
      <ul class="flex flex-wrap overflow-hidden h-[1.125rem] text-[13px] leading-[1.125rem] text-bone-400">
        <li v-for="(fact, n) in facts" :key="fact" class="whitespace-nowrap">
          <span v-if="n" class="mx-1.5 text-ink-500" aria-hidden="true">·</span>{{ fact }}
        </li>
      </ul>
    </div>

    <!-- Slot 4: where a price would be, and the action -->
    <div class="px-4 pb-4 pt-3 sm:pt-4">
      <p v-if="priceNote" class="mb-2 text-[11px] uppercase tracking-widest text-bone-400">{{ t('equipmentCatalogue.browser.priceNote') }}</p>
      <AddToCartButton type="vehicle" :id="vehicle.id" :max="units > 1 ? units : undefined" compact block :primary="primary" :accent="!primary" class="relative z-10" />
    </div>
  </article>
</template>

<script setup lang="ts">
import type { VehicleSummary } from '~/types'

const props = withDefaults(defineProps<{
  vehicle: VehicleSummary
  /** @nuxt/image sizes string matching the grid the card sits in */
  sizes?: string
  /** Photo browsing on the card (arrows, counter, swipe). Off on teaser rows. */
  gallery?: boolean
  /** Filled gold add button; otherwise an outline that fills on hover */
  primary?: boolean
  /** The "price on request" line above the button; off where the page already says it once */
  priceNote?: boolean
}>(), {
  priceNote: true,
  sizes: 'xs:100vw sm:50vw md:33vw',
  gallery: true,
  primary: false,
})

const { t, te } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()
const { vehiclePath } = useItemPaths()
const cart = useCart()

const inCart = computed(() => cart.has('vehicle', props.vehicle.id))
const units = computed(() => props.vehicle.specs.units ?? 1)

// "Ford Transit - Kassabíll (Minnaprófs)" → name, and the bracketed note as a tag
const name = computed(() => splitEquipmentName(lt(props.vehicle.name)))

// The type sits in its own label above the name, so a name that ends with it
// ("Ford Transit - Kassabíll", "Hobby Prestige 560 WFU hjólhýsi") drops that word here.
const shortName = computed(() => {
  const full = name.value.main
  const label = kindLabel.value.toLowerCase()
  // "Six-wheeler ATV" labels a name that ends in "Six-Wheeler": try the label's first word too.
  const suffix = [label, label.split(' ')[0]!].find(s => full.toLowerCase().endsWith(s))
  if (!suffix) return full
  // Only when it stands as its own word: "… WFU hjólhýsi" loses it,
  // the compound "… lúxushjólhýsi" keeps its last word whole.
  if (!/[\s\-–]$/.test(full.slice(0, full.length - suffix.length))) return full
  const rest = full.slice(0, full.length - suffix.length).replace(/[\s\-–]+$/, '')
  // "Ford Transit Cargo Van" becomes "Ford Transit"; "… WFU Luxury Caravan"
  // would be left ending on an adjective, so it stays whole.
  const model = props.vehicle.model
  if (model && !rest.toLowerCase().endsWith(model.toLowerCase())) return full
  return rest.split(/\s+/).length >= 2 ? rest : full
})

// The dropped type word stays in the link text for screen readers and
// crawlers: the link still reads "Ford Transit sendibíll".
const droppedWord = computed(() =>
  shortName.value === name.value.main ? '' : ` ${name.value.main.slice(shortName.value.length).replace(/^[\s\-–]+/, '')}`)

const kindLabel = computed(() => {
  const key = `catalogue.kindOne.${props.vehicle.kind}`
  return props.vehicle.kind && te(key) ? t(key) : t(`categories.${props.vehicle.category}`)
})

// Tags under the name: how many there are, and the bracketed note from the name.
// A vehicle with neither shows its drive there (4x4, 6x6) when it has one.
const drive = computed(() => {
  const d = props.vehicle.specs.drivetrain
  return d && d !== '2wd' ? d : ''
})
const ownTags = computed(() => [
  units.value > 1 ? t('catalogue.unitsAvailable', { n: units.value }) : '',
  name.value.detail,
].filter(Boolean))
const tags = computed(() => (ownTags.value.length ? ownTags.value : [drive.value].filter(Boolean)))

// The first three of: sleeps, seats, drive, transmission, fuel (short enough for one line)
const facts = computed(() => {
  const s = props.vehicle.specs
  return [
    s.sleeps ? t('catalogue.sleepsN', { n: s.sleeps }) : '',
    s.seats ? `${s.seats} ${t('vehicle.specs.seats').toLowerCase()}` : '',
    ownTags.value.length ? drive.value : '',
    s.towingCapacityKg
      ? `${s.towingCapacityKg} kg ${t('vehicle.specs.towingCapacityKg').toLowerCase()}`
      : (s.towHitch ? t('vehicle.specs.towHitch') : ''),
    s.transmission ? t(`vehicle.specs.${s.transmission}`) : '',
    s.fuel ? t(`vehicle.specs.${s.fuel}`) : '',
  ].filter(Boolean).slice(0, 3)
    // One line only: stop before the fact that would push the line past what a card holds.
    .filter((_, n, list) => list.slice(0, n + 1).join(' · ').length <= 38)
})

// The title link covers the whole card, so the card itself shows keyboard focus.
const focusRing = '[&:has(a:focus-visible)]:outline [&:has(a:focus-visible)]:outline-2 [&:has(a:focus-visible)]:outline-offset-2 [&:has(a:focus-visible)]:outline-gold-400'

// Is the shown photo a cut-out on white? Its four corners say so. Checked in the
// browser once the image has loaded (same-origin, so the canvas can be read).
const card = ref<HTMLElement | null>(null)
const cutout = ref(false)
const probe = () => {
  const img = card.value?.querySelector('img')
  if (!img || !img.naturalWidth) return
  try {
    const size = 16
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    // White underneath: a transparent PNG is a cut-out too, and its clear corners would read as black.
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(img, 0, 0, size, size)
    const corners = [[0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1]] as const
    cutout.value = corners.every(([x, y]) => {
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
      return r! > 242 && g! > 242 && b! > 242
    })
  }
  catch {
    // canvas not readable: leave the photo as a photo
  }
}
onMounted(() => nextTick(probe))

// Photo browsing: arrows, or a sideways swipe on the card
const active = ref(0)
const step = (dir: number) => {
  active.value = (active.value + dir + props.vehicle.images.length) % props.vehicle.images.length
}
let swipeX = 0
let swipeY = 0
const swipeStart = (e: TouchEvent) => {
  swipeX = e.touches[0]?.clientX ?? 0
  swipeY = e.touches[0]?.clientY ?? 0
}
const swipeEnd = (e: TouchEvent) => {
  if (!props.gallery || props.vehicle.images.length < 2) return
  const dx = (e.changedTouches[0]?.clientX ?? 0) - swipeX
  const dy = (e.changedTouches[0]?.clientY ?? 0) - swipeY
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1)
}
</script>
