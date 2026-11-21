<template>
  <!-- The fleet catalogue body, shared by the hub (/vehicles) and every type
       page: type rail, the vehicles as fact rows, and the visitor's
       quote list. Same shell as the equipment catalogue, without search (the
       fleet is a handful of vehicles, all visible at once). -->
  <div class="wrap pt-4 pb-10 lg:pt-8 lg:pb-12">
    <div class="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-14">
      <!-- ── Rail (desktop) ─────────────────────────────────────────────── -->
      <aside class="hidden lg:block">
        <div class="sticky top-24 xl:top-28 max-h-[calc(100vh-7.5rem)] overflow-y-auto pr-1 pb-2">
          <p class="meta text-bone-400">{{ t('catalogue.types') }}</p>
          <!-- Real links to the type pages, so every type keeps its own URL -->
          <nav class="mt-3" :aria-label="t('catalogue.types')">
            <ul>
              <li v-for="link in links" :key="link.key">
                <NuxtLink
                  :to="link.to"
                  class="block border-l-2 py-[0.4375rem] pl-4 pr-2 text-sm transition-colors"
                  :class="link.active
                    ? 'border-gold-500 bg-ink-800/70 text-bone-100 font-medium'
                    : 'border-ink-700 text-bone-400 hover:border-ink-500 hover:text-bone-100'"
                  :aria-current="link.active ? 'page' : undefined"
                >
                  <span>{{ link.label }}</span>
                </NuxtLink>
              </li>
            </ul>
          </nav>

          <QuotePanel class="mt-6" :empty-text="t('catalogue.listEmpty')" />
        </div>
      </aside>

      <!-- ── Main column ────────────────────────────────────────────────── -->
      <div class="min-w-0">
        <div>
          <!-- Types on small screens: one swipeable line under the site header -->
          <div class="lg:hidden relative -mx-4 sm:-mx-6 border-b border-ink-800">
            <nav
              ref="chipScroller"
              class="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              :aria-label="t('catalogue.types')"
              @scroll.passive="chipsScrolled = ($event.target as HTMLElement).scrollLeft > 8"
            >
              <ul class="flex gap-2 pl-4 pr-12 sm:pl-6 py-2 w-max">
                <li v-for="link in links" :key="link.key">
                  <NuxtLink
                    :to="link.to"
                    class="inline-flex items-center gap-2 min-h-[2.75rem] px-3.5 border text-[13px] font-medium whitespace-nowrap transition-colors"
                    :class="link.active
                      ? 'bg-gold-500 border-gold-500 text-ink-950'
                      : 'border-ink-700 text-bone-400 hover:border-ink-500 hover:text-bone-100'"
                    :aria-current="link.active ? 'page' : undefined"
                  >
                    {{ link.label }}
                  </NuxtLink>
                </li>
              </ul>
            </nav>
            <div v-if="chipsScrolled" class="pointer-events-none absolute inset-y-0 left-0 w-4 sm:w-6 bg-ink-950" aria-hidden="true" />
            <div class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-ink-950 to-transparent" aria-hidden="true" />
          </div>

          <!-- Count line -->
          <div class="flex items-baseline justify-between gap-4 pt-5 lg:pt-0 pb-3 border-b border-ink-700">
            <h2 class="h3">{{ heading }}</h2>
            <p class="shrink-0 text-sm text-bone-400 tabular-nums">{{ t('catalogue.count', vehicles.length) }} · {{ t('catalogue.priceOnQuote') }}</p>
          </div>

          <div v-if="vehicles.length" class="mt-5 grid gap-4">
            <VehicleRow v-for="(v, n) in vehicles" :key="v.id" :vehicle="v" :eager="n === 0" />
          </div>
          <div v-else class="py-16 text-center">
            <p class="text-bone-400">{{ t('catalogue.empty') }}</p>
            <NuxtLink :to="localePath('/contact')" class="btn-gold mt-6">
              {{ t('catalogue.emptyCta') }}
            </NuxtLink>
          </div>

          <!-- A type page's own copy (about the type, FAQ) comes straight after its vehicles -->
          <slot />

          <!-- A type page with one or two vehicles is not a dead end: the rest of
               the fleet follows, as compact cards, so the page stays about its type -->
          <template v-if="others.length">
            <h2 class="h3 mt-14 pb-3 border-b border-ink-700">{{ t('catalogue.otherTitle') }}</h2>
            <div class="mt-6 card-grid">
              <VehicleCard v-for="v in others" :key="v.id" :vehicle="v" :gallery="false" class="sm:grid-rows-subgrid sm:row-span-4" />
            </div>
          </template>

          <!-- Vehicles and equipment go on one list: point at the other half -->
          <section class="mt-8 border border-ink-700 bg-ink-900 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div class="flex-1">
              <h2 class="h4">{{ t('catalogue.equipmentTitle') }}</h2>
              <p class="mt-1.5 text-sm leading-relaxed text-bone-400">{{ t('catalogue.equipmentText') }}</p>
            </div>
            <NuxtLink :to="localePath('/equipment')" class="btn-outline btn-sm max-sm:min-h-[2.75rem] shrink-0">
              {{ t('common.viewEquipment') }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </NuxtLink>
          </section>
        </div>
      </div>
    </div>

    <QuoteBar />
  </div>
</template>

<script setup lang="ts">
import type { VehicleLanding } from '~/data/vehicleLandings'
import { vehicleLandings } from '~/data/vehicleLandings'

const props = defineProps<{
  /** Set on a type page; the hub leaves it out and shows the whole fleet. */
  landing?: VehicleLanding
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const { all, byKind } = await useVehicles()

// Hub order: types in landing order, then vehicles whose type has no page yet.
const ordered = computed(() => {
  const list = all()
  const covered = new Set(vehicleLandings.map(l => l.kind))
  return [
    ...vehicleLandings.flatMap(l => list.filter(v => v.kind === l.kind)),
    ...list.filter(v => !v.kind || !covered.has(v.kind)),
  ]
})

const vehicles = computed(() => (props.landing ? byKind(props.landing.kind) : ordered.value))
const others = computed(() => (props.landing ? ordered.value.filter(v => v.kind !== props.landing!.kind) : []))
const heading = computed(() => (props.landing ? t(`catalogue.kinds.${props.landing.kind}`) : t('catalogue.all')))

// Only types that have vehicles are offered; the current page always stays.
const links = computed(() => [
  { key: '', label: t('catalogue.all'), to: localePath('/vehicles'), active: !props.landing },
  ...vehicleLandings
    .filter(l => l.id === props.landing?.id || byKind(l.kind).length)
    .map(l => ({
      key: l.id,
      label: t(`catalogue.kinds.${l.kind}`),
      to: localePath({ name: l.routeName }),
      active: l.id === props.landing?.id,
    })),
])

// Phones: a type page starts with its own chip in view, at the page gutter.
const chipScroller = ref<HTMLElement | null>(null)
const chipsScrolled = ref(false)
onMounted(() => {
  const scroller = chipScroller.value
  const current = scroller?.querySelector<HTMLElement>('[aria-current]')
  if (scroller && current && props.landing) scroller.scrollLeft = Math.max(0, current.offsetLeft - (window.innerWidth >= 640 ? 24 : 16))
})
</script>
