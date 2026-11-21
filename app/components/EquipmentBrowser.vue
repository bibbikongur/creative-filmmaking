<template>
  <!-- The equipment catalogue body, shared by the hub (/equipment) and every
       category page: category rail with counts, search across the whole
       catalogue, grid / list switch and the visitor's quote list. -->
  <div id="catalogue" class="wrap pt-4 pb-16 lg:pt-8 lg:pb-24 scroll-mt-16 xl:scroll-mt-20">
    <div class="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-14">
      <!-- ── Rail (desktop) ─────────────────────────────────────────────── -->
      <aside class="hidden lg:block">
        <div class="sticky top-24 xl:top-28 max-h-[calc(100vh-7.5rem)] overflow-y-auto pr-1 pb-2">
          <p class="meta text-bone-400">{{ t('equipmentCatalogue.browser.categories') }}</p>
          <!-- On the hub the rail jumps between the sections of this page and follows
               the scroll; on a category page it links to the other category pages. -->
          <nav class="mt-3" :aria-label="t('equipmentCatalogue.browser.categories')">
            <ul>
              <li v-for="link in links" :key="link.key">
                <NuxtLink
                  :to="link.to"
                  class="flex items-baseline justify-between gap-3 border-l-2 py-[0.4375rem] pl-4 pr-2 text-sm transition-colors"
                  :class="link.active
                    ? 'border-gold-500 bg-ink-800/70 text-bone-100 font-medium'
                    : 'border-ink-700 text-bone-400 hover:border-ink-500 hover:text-bone-100'"
                  :aria-current="link.active ? (category ? 'page' : 'true') : undefined"
                  @click="jump($event, link.key)"
                >
                  <span>{{ link.label }}</span>
                  <span class="text-xs tabular-nums" :class="link.active ? 'text-gold-400' : 'text-bone-400'">{{ link.count }}</span>
                </NuxtLink>
              </li>
            </ul>
          </nav>

          <QuotePanel class="mt-6" />
        </div>
      </aside>

      <!-- ── Main column ────────────────────────────────────────────────── -->
      <div class="min-w-0">
        <!-- The sticky bar only travels as far as the catalogue itself -->
        <div>
          <!-- Search, view switch and (below lg) the categories: stays under the site header -->
          <div class="sticky top-16 xl:top-20 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 bg-ink-950 border-b border-ink-800 shadow-[0_10px_14px_-10px_rgba(0,0,0,0.75)]">
            <div
              class="flex items-center gap-3 overflow-hidden transition-[max-height,opacity,padding] duration-200 lg:!max-h-none lg:!opacity-100 lg:!py-2"
              :class="searchTucked ? 'max-h-0 opacity-0 py-0' : 'max-h-16 opacity-100 py-2'"
              :inert="searchTucked && !isDesktop"
            >
              <div class="relative flex-1">
                <svg class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                </svg>
                <input
                  v-model="query"
                  type="search"
                  enterkeyhint="search"
                  autocomplete="off"
                  class="input-dark h-11 py-0 pl-10 pr-10 placeholder-bone-400/80 [&::-webkit-search-cancel-button]:hidden"
                  :placeholder="t('equipmentCatalogue.browser.searchPlaceholder')"
                  :aria-label="t('equipmentCatalogue.browser.searchLabel')"
                  @keydown.esc="query = ''"
                  @focus="searchFocused = true"
                  @blur="searchFocused = false"
                >
                <button
                  v-if="query"
                  type="button"
                  class="absolute right-0 top-0 h-11 w-11 inline-flex items-center justify-center text-bone-400 hover:text-bone-100 transition-colors"
                  :aria-label="t('equipmentCatalogue.browser.clear')"
                  @click="query = ''"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <!-- The only live region for results: the count, not the whole grid -->
              <p class="max-md:sr-only shrink-0 text-sm text-bone-400 tabular-nums" role="status">
                {{ t('equipmentCatalogue.count', shownCount) }}
              </p>
              <ViewToggle :model-value="view" class="shrink-0" @update:model-value="setView" />
            </div>

            <!-- Categories on small screens: one swipeable line, with a fade where it runs on -->
            <div class="lg:hidden relative -mx-4 sm:-mx-6">
              <nav
                ref="chipScroller"
                class="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                :aria-label="t('equipmentCatalogue.browser.categories')"
                @scroll.passive="chipsScrolled = ($event.target as HTMLElement).scrollLeft > 8"
              >
                <ul class="flex gap-2 pl-4 pr-12 sm:pl-6 w-max" :class="searchTucked ? 'py-2' : 'pb-2'">
                  <li v-for="link in links" :key="link.key">
                    <NuxtLink
                      :to="link.to"
                      :data-chip="link.key"
                      class="inline-flex items-center gap-2 min-h-[2.75rem] px-3.5 border text-[13px] font-medium whitespace-nowrap transition-colors"
                      :class="link.active
                        ? 'bg-gold-500 border-gold-500 text-ink-950'
                        : 'border-ink-700 text-bone-400 hover:border-ink-500 hover:text-bone-100'"
                      :aria-current="link.active ? (category ? 'page' : 'true') : undefined"
                      @click="jump($event, link.key)"
                    >
                      {{ link.label }}
                      <span class="text-xs tabular-nums" :class="link.active ? 'text-ink-950/75' : 'text-bone-400'">{{ link.count }}</span>
                    </NuxtLink>
                  </li>
                </ul>
              </nav>
              <div v-if="chipsScrolled" class="pointer-events-none absolute inset-y-0 left-0 w-4 sm:w-6 bg-ink-950" aria-hidden="true" />
              <div class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-ink-950 to-transparent" aria-hidden="true" />
            </div>
          </div>

          <!-- ── Search results: one flat list across every category ──────── -->
          <section v-if="searching" class="mt-6">
            <template v-if="results.length">
              <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-3 border-b border-ink-700">
                <h2 class="h3">
                  {{ t('equipmentCatalogue.browser.resultsTitle') }}
                  <span class="ml-2 font-sans text-sm font-normal normal-case tracking-normal text-bone-400">„{{ query.trim() }}“</span>
                </h2>
                <span class="text-sm text-bone-400 tabular-nums md:hidden" aria-hidden="true">{{ t('equipmentCatalogue.count', results.length) }}</span>
              </div>
              <div :class="view === 'list' ? listClass : gridClass">
                <EquipmentCard
                  v-for="e in results"
                  :key="e.id"
                  :item="e"
                  :category-label="label(e.category)"
                  :layout="view === 'list' ? 'row' : 'grid'"
                  :sizes="cardSizes"
                  dense
                />
              </div>
            </template>
            <div v-else class="py-16 text-center">
              <p class="h3">{{ t('equipmentCatalogue.browser.noResults', { q: query.trim() }) }}</p>
              <p class="mt-3 text-bone-400">{{ t('equipmentCatalogue.browser.noResultsHint') }}</p>
              <div class="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" class="btn-outline" @click="query = ''">
                  {{ t('equipmentCatalogue.browser.clear') }}
                </button>
                <NuxtLink :to="localePath('/contact')" class="btn-gold">
                  {{ t('nav.contact') }}
                </NuxtLink>
              </div>
            </div>
          </section>

          <!-- ── One category ─────────────────────────────────────────────── -->
          <template v-else-if="category">
            <!-- Section heading for the item list, so the outline is H1, H2
                 (the category), H3 (its items); the chips above show it. -->
            <h2 class="sr-only">{{ label(category.id) }}</h2>
            <div v-if="categoryItems.length" :class="[view === 'list' ? listClass : gridClass, 'mt-6']">
              <EquipmentCard
                v-for="e in categoryItems"
                :key="e.id"
                :item="e"
                :layout="view === 'list' ? 'row' : 'grid'"
                :sizes="cardSizes"
                dense
              />
            </div>
            <div v-else class="py-16 text-center">
              <p class="text-bone-400">{{ t('equipmentCatalogue.empty') }}</p>
              <NuxtLink :to="localePath('/contact')" class="btn-gold mt-6">
                {{ t('common.requestOffer') }}
              </NuxtLink>
            </div>
          </template>

          <!-- ── Hub: every category, in admin order ──────────────────────── -->
          <template v-else-if="groups.length">
            <section
              v-for="group in groups"
              :id="`cat-${group.key}`"
              :key="group.key"
              :data-section="group.key"
              class="pt-8 first-of-type:pt-6 scroll-mt-[10.25rem] lg:scroll-mt-[7.25rem] xl:scroll-mt-[8.25rem]"
            >
              <div class="flex items-baseline justify-between gap-4 pb-2.5 border-b border-ink-700">
                <!-- The item count sits beside the heading, not in it, so the outline reads "Rafmagn", not "Rafmagn14" -->
                <div class="flex items-baseline gap-3 min-w-0">
                  <h2 class="h3 min-w-0">
                    <NuxtLink v-if="group.to" :to="group.to" class="hover:text-gold-400 transition-colors">{{ group.title }}</NuxtLink>
                    <span v-else>{{ group.title }}</span>
                  </h2>
                  <span class="shrink-0 font-sans text-sm font-normal normal-case tracking-normal text-bone-400 tabular-nums">{{ group.items.length }}</span>
                </div>
                <!-- The category's own page (intro, FAQ): a quiet link, the amber stays on actions -->
                <NuxtLink
                  v-if="group.to"
                  :to="group.to"
                  class="shrink-0 inline-flex items-center justify-end gap-1.5 max-sm:min-w-[2.75rem] max-sm:min-h-[2.75rem] max-sm:-my-3 text-[13px] text-bone-400 hover:text-gold-400 transition-colors"
                  :aria-label="`${t('equipmentCatalogue.browser.viewCategory')}: ${group.title}`"
                  tabindex="-1"
                >
                  <span class="max-sm:sr-only">{{ t('equipmentCatalogue.browser.viewCategory') }}</span>
                  <svg class="w-3.5 h-3.5 max-sm:w-5 max-sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>
              </div>
              <div :class="view === 'list' ? listClass : gridClass">
                <EquipmentCard
                  v-for="e in group.items"
                  :key="e.id"
                  :item="e"
                  :layout="view === 'list' ? 'row' : 'grid'"
                  :sizes="cardSizes"
                  dense
                />
              </div>
            </section>
          </template>
          <div v-else class="py-16 text-center">
            <p class="text-bone-400">{{ t('equipmentCatalogue.empty') }}</p>
            <NuxtLink :to="localePath('/contact')" class="btn-gold mt-6">
              {{ t('equipmentCatalogue.emptyCta') }}
            </NuxtLink>
          </div>
        </div>

        <slot />
      </div>
    </div>

    <QuoteBar />
  </div>
</template>

<script setup lang="ts">
import type { EquipmentCategorySummary, EquipmentItem } from '~/types'

const props = defineProps<{
  /** Set on a category page; the hub leaves it out and shows every category. */
  category?: EquipmentCategorySummary
}>()

const { t } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()
const cart = useCart()
const { all, byCategory } = await useEquipment()
const { all: categories, label, path, text } = await useEquipmentCategories()
// The hub holds the whole catalogue, so it opens as a compact list (no half-empty
// rows for small categories); one category opens as a photo grid.
const { view, set: setView } = props.category
  ? useCatalogueView('equipment-category', 'grid')
  : useCatalogueView('equipment', 'list')

const gridClass = 'mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 min-[1440px]:grid-cols-4 xl:gap-5'
const listClass = 'mt-1 divide-y divide-ink-800 border-b border-ink-800'
const cardSizes = 'xs:50vw sm:33vw lg:25vw'

// ── Content ──────────────────────────────────────────────────────────────────
const categoryItems = computed(() => (props.category ? byCategory(props.category.id) : []))

// Rows per category in admin order; items whose category was archived or
// removed gather in a final row so nothing disappears from the site.
const groups = computed(() => {
  const list = all()
  const rows: { key: string, title: string, to: string, items: EquipmentItem[] }[] = categories().flatMap((c) => {
    const items = list.filter(e => e.category === c.id)
    return items.length ? [{ key: c.id, title: text(c.name), to: path(c), items }] : []
  })
  const known = new Set(categories().map(c => c.id))
  const rest = list.filter(e => !known.has(e.category))
  if (rest.length) rows.push({ key: 'other', title: t('equipmentCatalogue.otherGroup'), to: '', items: rest })
  return rows
})

// ── Search ───────────────────────────────────────────────────────────────────
// Always across the whole catalogue (also on a category page), every word must
// match, accents optional: "rafstod" finds "Rafstöð".
const query = ref('')
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ð/g, 'd').replace(/þ/g, 'th').replace(/æ/g, 'ae')

const index = computed(() => all().map(e => ({
  item: e,
  hay: fold([e.name.is, e.name.en, lt(e.tagline), label(e.category)].filter(Boolean).join(' ')),
})))

const searching = computed(() => query.value.trim().length > 0)
const results = computed(() => {
  const words = fold(query.value).split(/\s+/).filter(Boolean)
  return index.value.filter(row => words.every(w => row.hay.includes(w))).map(row => row.item)
})

const shownCount = computed(() => {
  if (searching.value) return results.value.length
  return props.category ? categoryItems.value.length : all().length
})

// ── Category rail / chips ────────────────────────────────────────────────────
// Hub: the section currently under the sticky bar ('' = above the first one).
const spied = ref('')

const links = computed(() => {
  const counts = new Map<string, number>()
  for (const e of all()) counts.set(e.category, (counts.get(e.category) ?? 0) + 1)
  const hub = !props.category
  return [
    {
      key: '',
      label: t('equipmentCatalogue.all'),
      to: hub ? { hash: '#catalogue' } : localePath('/equipment'),
      count: all().length,
      active: hub && !spied.value,
    },
    ...categories()
      .filter(c => c.id === props.category?.id || counts.has(c.id))
      .map(c => ({
        key: c.id,
        label: text(c.name),
        // Hub: jump within the page. Category page: go to the other category's page.
        to: hub ? { hash: `#cat-${c.id}` } : path(c),
        count: counts.get(c.id) ?? 0,
        active: hub ? spied.value === c.id : c.id === props.category?.id,
      })),
  ]
})

// Hub jump: leave search first (the sections are not rendered while searching).
const jump = async (event: MouseEvent, key: string) => {
  if (props.category) return
  event.preventDefault()
  query.value = ''
  await nextTick()
  const target = document.getElementById(key ? `cat-${key}` : 'catalogue')
  target?.scrollIntoView({ block: 'start' })
}

const chipScroller = ref<HTMLElement | null>(null)
// The active chip lines up with the page gutter (16px, 24px from sm), where a solid edge hides its neighbour.
const gutter = () => (window.innerWidth >= 640 ? 24 : 16)
const chipsScrolled = ref(false)

// Below lg the sticky block is search + chips; scrolling down tucks the search
// row away so the chips alone stay (less chrome on a phone), scrolling up, a
// focused field or an active search brings it back.
const isDesktop = ref(true)
const searchFocused = ref(false)
const scrollingDown = ref(false)
const searchTucked = computed(() => scrollingDown.value && !searchFocused.value && !searching.value)
let lastY = 0
let lastToggle = 0
const trackDirection = () => {
  const y = window.scrollY
  const delta = y - lastY
  if (Math.abs(delta) < 12) return
  lastY = y
  const now = performance.now()
  // The bar changing height nudges the scroll position; ignore that echo.
  if (now - lastToggle < 300) return
  const down = delta > 0 && y > 480
  if (down !== scrollingDown.value) {
    scrollingDown.value = down
    lastToggle = now
  }
}
const onResize = () => {
  isDesktop.value = window.innerWidth >= 1024
}

let frame = 0
const spy = () => {
  frame = 0
  trackDirection()
  if (props.category || searching.value) return
  // A section counts as current once its heading has reached the sticky bar.
  const line = window.innerWidth >= 1024 ? 150 : 190
  let current = ''
  for (const el of document.querySelectorAll<HTMLElement>('[data-section]')) {
    if (el.getBoundingClientRect().top <= line) current = el.dataset.section ?? ''
    else break
  }
  spied.value = current
}
const onScroll = () => {
  if (!frame) frame = requestAnimationFrame(spy)
}

// Keep the active chip in view on small screens.
watch(spied, async (key) => {
  await nextTick()
  const scroller = chipScroller.value
  const chip = scroller?.querySelector<HTMLElement>(`[data-chip="${key}"]`)
  if (!scroller || !chip || !scroller.offsetParent) return
  scroller.scrollTo({ left: Math.max(0, chip.offsetLeft - gutter()), behavior: 'smooth' })
})

onMounted(() => {
  // A category page starts with its own chip in view, clear of the edge fades.
  const scroller = chipScroller.value
  const current = scroller?.querySelector<HTMLElement>('[aria-current]')
  if (scroller && current && props.category) scroller.scrollLeft = Math.max(0, current.offsetLeft - gutter())
  onResize()
  lastY = window.scrollY
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  spy()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onScroll)
  if (frame) cancelAnimationFrame(frame)
})

</script>
