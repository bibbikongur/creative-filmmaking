<template>
  <!-- A vehicle in the fleet catalogue: photos in a fixed 3:2 frame beside the
       facts a booker compares (seats, drive, load, size), stacked on a phone.
       The title link is stretched over the whole card; controls sit above it
       with relative z-10. Amber is kept for "on the list" and the add button. -->
  <article
    class="group relative flex flex-col md:flex-row ring-1 transition-shadow duration-200"
    :class="[focusRing, inCart ? 'bg-ink-800 ring-2 ring-gold-500' : 'bg-ink-800 ring-ink-700/70 [@media(hover:hover)]:hover:ring-ink-400']"
    @touchstart.passive="swipeStart"
    @touchend.passive="swipeEnd"
  >
    <!-- Photos: always 3:2, so vehicles shot side-on are not cut in half -->
    <div class="relative overflow-hidden bg-ink-900 md:w-[44%] lg:w-[18rem] xl:w-[21rem] min-[1440px]:w-[24rem] md:shrink-0">
      <div class="aspect-[3/2]" aria-hidden="true" />
      <NuxtImg
        v-if="vehicle.images.length"
        :key="active"
        :src="vehicle.images[active]!"
        :provider="imgProvider(vehicle.images[active]!)"
        :alt="lt(vehicle.name)"
        class="absolute inset-0 w-full h-full object-cover"
        sizes="xs:100vw md:384px"
        format="webp"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : undefined"
      />
      <ImagePlaceholder v-else />

      <span v-if="inCart" class="absolute top-0 left-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gold-500 text-ink-950 text-xs font-semibold uppercase tracking-wider">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
        </svg>
        {{ t('cart.added') }}
      </span>

      <!-- Arrows hide until hover only where there is a pointer that can hover -->
      <template v-if="vehicle.images.length > 1">
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
        <!-- A count reads better than sixteen dots -->
        <span class="absolute bottom-2 right-2 px-2 py-1 bg-ink-950/75 text-bone-100 text-xs font-medium tabular-nums" aria-hidden="true">
          {{ active + 1 }} / {{ vehicle.images.length }}
        </span>
      </template>
    </div>

    <!-- Facts -->
    <div class="min-w-0 flex-1 flex flex-col p-4 sm:p-5 lg:px-6 lg:py-4">
      <div>
        <h3 class="font-heading font-semibold uppercase tracking-wide text-lg sm:text-xl leading-snug text-bone-100">
          <NuxtLink
            :to="localePath(`/vehicles/${vehicle.slug}`)"
            class="after:absolute after:inset-0 after:content-[''] underline-offset-4 decoration-ink-400 decoration-1 [@media(hover:hover)]:group-hover:underline focus-visible:outline-none"
          >
            {{ name.main }}
          </NuxtLink>
        </h3>
        <!-- The bracketed note in the name ("Minnaprófs") is a selling point: a tag, not a grey subline -->
        <p v-if="name.detail || units > 1" class="mt-1 flex flex-wrap gap-2">
          <span v-if="units > 1" class="inline-flex items-center border border-ink-500 px-2 py-0.5 text-xs font-medium text-bone-100 whitespace-nowrap">{{ t('catalogue.unitsAvailable', { n: units }) }}</span>
          <span v-if="name.detail" class="inline-flex items-center border border-ink-500 px-2 py-0.5 text-xs font-medium text-bone-100 whitespace-nowrap">{{ name.detail }}</span>
        </p>
      </div>
      <p class="mt-1.5 text-sm leading-relaxed text-bone-400 max-w-2xl md:line-clamp-2">{{ lt(vehicle.tagline) }}</p>

      <!-- Key facts as label / value pairs across the panel, so vehicles compare down the page -->
      <dl v-if="facts.length" class="mt-3 grid grid-cols-3 min-[1440px]:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-3 border-t border-ink-700 pt-3">
        <div
          v-for="fact in facts"
          :key="fact.label"
          class="flex flex-col"
          :class="[fact.wide ? 'col-span-2' : '', fact.three ? '' : 'max-[1439px]:hidden']"
        >
          <dt class="text-xs uppercase tracking-wide text-bone-400">{{ fact.label }}</dt>
          <dd class="mt-auto pt-0.5 text-sm font-medium text-bone-100 whitespace-nowrap">{{ fact.value }}</dd>
        </div>
      </dl>

      <!-- What it comes with: always its own line under the facts -->
      <ul v-if="tags.length" class="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-bone-400">
        <li v-for="tag in tags" :key="tag.text" class="inline-flex items-center gap-1.5 whitespace-nowrap">
          <svg v-if="tag.tick" class="w-3.5 h-3.5 text-bone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          {{ tag.text }}
        </li>
      </ul>

      <!-- The two ways on from here: always alone on the last line, in the same place on every row -->
      <div class="mt-auto pt-3">
        <div class="flex items-center justify-end border-t border-ink-700 pt-3">
          <div class="flex items-center gap-5 max-sm:w-full max-sm:justify-between">
            <span class="inline-flex items-center gap-1 text-sm text-bone-400 [@media(hover:hover)]:group-hover:text-bone-100 transition-colors">
              {{ t('common.viewDetails') }}
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
            <AddToCartButton type="vehicle" :id="vehicle.id" :max="units > 1 ? units : undefined" compact primary class="relative z-10 min-w-[9.25rem]" />
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/types'

const props = defineProps<{
  vehicle: Vehicle
  /** First row on the page: load its photo right away (it is the LCP image) */
  eager?: boolean
}>()

const { t, locale } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()
const cart = useCart()

const inCart = computed(() => cart.has('vehicle', props.vehicle.id))
const units = computed(() => props.vehicle.specs.units ?? 1)

// "Ford Transit - Kassabíll (Minnaprófs)" → name, and the bracketed note as a tag
const name = computed(() => splitEquipmentName(lt(props.vehicle.name)))

// Numbers the way the page's language writes them (7,5 m and 2.000 kg in
// Icelandic), done by hand: the server's Intl data does not always know "is".
const num = (n: number) => {
  const [whole, frac] = String(n).split('.')
  const is = locale.value === 'is'
  const grouped = whole!.replace(/\B(?=(\d{3})+(?!\d))/g, is ? '.' : ',')
  return frac ? `${grouped}${is ? ',' : '.'}${frac}` : grouped
}

// The facts that matter most for this vehicle, in a fixed order of importance;
// whatever a vehicle does not have simply makes room for the next.
const allFacts = computed(() => {
  const s = props.vehicle.specs
  const out: { label: string, value: string, wide?: boolean }[] = []
  const push = (key: string, value: string | undefined, wide = false) => {
    if (value) out.push({ label: t(`vehicle.specs.${key}`), value, wide })
  }
  push('sleeps', s.sleeps?.toString())
  push('seats', s.seats?.toString())
  push('drivetrain', s.drivetrain && s.drivetrain !== '2wd' ? s.drivetrain.toUpperCase() : undefined)
  const box = [s.boxLengthM, s.boxWidthM, s.boxHeightM].filter((n): n is number => !!n)
  push('boxShort', box.length ? `${box.map(num).join(' × ')} m` : undefined, true)
  push('payloadKg', s.payloadKg ? `${num(s.payloadKg)} kg` : undefined)
  push('towingCapacityKg', s.towingCapacityKg ? `${num(s.towingCapacityKg)} kg` : undefined)
  push('lengthM', s.lengthM ? `${num(s.lengthM)} m` : undefined)
  push('transmission', s.transmission ? t(`vehicle.specs.${s.transmission}`) : undefined)
  push('fuel', s.fuel ? t(`vehicle.specs.${s.fuel}`) : undefined)
  push('weightKg', s.weightKg ? `${num(s.weightKg)} kg` : undefined)
  return out
})

// Four across from 1440px, three below that and on phones (a wide fact takes two). A lone
// fact would be an orphan under its own rule, so it joins the tag line instead.
const facts = computed(() => {
  const list = allFacts.value.slice(0, 4)
  if (list.length < 2) return []
  let used = 0
  return list.map((fact) => {
    used += fact.wide ? 2 : 1
    return { ...fact, three: used <= 3 }
  })
})

const tags = computed(() => {
  const s = props.vehicle.specs
  // A lone fact reads "Eldsneyti: Dísel" and gets no tick: it is a property, not an extra.
  const lone = allFacts.value.length === 1
    ? [{ text: `${allFacts.value[0]!.label}: ${allFacts.value[0]!.value}`, tick: false }]
    : []
  return [
    ...lone,
    ...(['heating', 'generator', 'towHitch', 'winterEquipped', 'blackoutReady', 'wifi'] as const)
      .filter(key => s[key])
      .map(key => ({ text: t(`vehicle.specs.${key}`), tick: true })),
  ]
})

// The title link covers the whole card, so the card itself shows keyboard focus.
const focusRing = '[&:has(a:focus-visible)]:outline [&:has(a:focus-visible)]:outline-2 [&:has(a:focus-visible)]:outline-offset-2 [&:has(a:focus-visible)]:outline-gold-400'

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
  if (props.vehicle.images.length < 2) return
  const dx = (e.changedTouches[0]?.clientX ?? 0) - swipeX
  const dy = (e.changedTouches[0]?.clientY ?? 0) - swipeY
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1)
}
</script>
