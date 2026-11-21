<template>
  <div>
    <!-- Short head so the vehicles are in the first screen; the rest of the
         type's copy follows the catalogue. -->
    <header class="bg-ink-900 bg-hero-vignette border-b border-ink-800">
      <div class="wrap pt-6 pb-7 lg:pt-8 lg:pb-9">
        <Breadcrumbs :items="crumbs" />
        <div class="mt-5 max-w-3xl">
          <h1 class="h1 lg:text-4xl/[1.2]">{{ t(`${k}.title`) }}</h1>
          <template v-if="intro[0]">
            <p id="type-intro" class="mt-4 text-bone-400 leading-relaxed" :class="introOpen ? '' : 'max-sm:line-clamp-3'">{{ intro[0] }}</p>
            <button
              type="button"
              class="sm:hidden mt-1 min-h-[2.75rem] text-sm font-medium text-bone-100 underline decoration-ink-500 underline-offset-4"
              :aria-expanded="introOpen"
              aria-controls="type-intro"
              @click="introOpen = !introOpen"
            >
              {{ introOpen ? t('equipmentCatalogue.browser.readLess') : t('equipmentCatalogue.browser.readMore') }}
            </button>
          </template>
          <p class="mt-4 max-sm:mt-1 flex items-start gap-2.5 text-sm leading-snug text-bone-100">
            <svg class="w-4 h-4 mt-0.5 shrink-0 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ t('equipmentCatalogue.browser.lead') }} {{ t('equipmentCatalogue.browser.leadNote') }}
          </p>
        </div>
      </div>
    </header>

    <FleetBrowser :landing="landing">
      <section v-if="intro.length > 1" class="mt-14 lg:mt-16 pt-10 border-t border-ink-800 max-w-3xl">
        <h2 class="h2">{{ t(`${k}.aboutTitle`) }}</h2>
        <div class="mt-4 space-y-4 text-bone-400 leading-relaxed">
          <p v-for="(paragraph, n) in intro.slice(1)" :key="n">{{ paragraph }}</p>
        </div>
      </section>
      <FaqSection class="mt-14 lg:mt-16" :kicker="t('faq.kicker')" :title="t('faq.title')" :items="faqItems" />
    </FleetBrowser>

    <CtaBanner />
  </div>
</template>

<script setup lang="ts">
import type { VehicleLanding } from '~/data/vehicleLandings'

// Shared body of every /vehicles/<kind> keyword page. The page file only
// picks the landing and declares the English path; copy comes from the
// locale files under the landing's i18n key.
const props = defineProps<{ landing: VehicleLanding }>()

const { t, te } = useI18n()
const localePath = useLocalePath()
const { byKind } = await useVehicles()
const { vehiclePath } = useItemPaths()
const { faq } = useFaq()

const k = props.landing.key
const vehicles = computed(() => byKind(props.landing.kind))

const intro = computed(() =>
  [1, 2, 3].map(i => `${k}.intro${i}`).filter(key => te(key)).map(key => t(key)),
)

const faqItems = computed(() => faq(`${k}.faq`))

// Phones show three lines of the intro until asked for more.
const introOpen = ref(false)

const crumbs = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.fleet'), to: localePath('/vehicles') },
  { label: t(`${k}.title`), to: localePath({ name: props.landing.routeName }) },
])

// The first vehicle's photo stands for the page (share image and main image),
// not the site-wide fleet photo.
const { ogImageUrl } = useOgImage()
const firstImage = vehicles.value.find(v => v.images[0])?.images[0]

useSeoMeta({
  ...(firstImage ? { ogImage: ogImageUrl(firstImage, 'cover'), ogImageWidth: 1200, ogImageHeight: 630, ogImageAlt: () => t(`${k}.title`) } : {}),
  title: () => t(`${k}.metaTitle`),
  description: () => t(`${k}.metaDescription`),
  ogTitle: () => `${t(`${k}.metaTitle`)} · Creative Filmmaking`,
  ogDescription: () => t(`${k}.metaDescription`),
})
// An empty category is a thin page; keep it out of the index until it has
// stock. (Set only then: an undefined robots value here would remove the
// site-wide "index, follow, max-image-preview:large" tag from the page.)
if (!vehicles.value.length) useSeoMeta({ robots: 'noindex, follow' })

const siteUrl = useRuntimeConfig().public.siteUrl
useSchemaOrg([
  defineWebPage({
    '@type': faqItems.value.length ? ['CollectionPage', 'FAQPage'] : 'CollectionPage',
    ...(firstImage ? { primaryImageOfPage: firstImage.startsWith('http') ? firstImage : `${siteUrl}${firstImage}` } : {}),
  }),
  defineItemList({
    itemListElement: vehicles.value.map(v => ({
      url: `${siteUrl}${vehiclePath(v)}`,
    })),
  }),
])
</script>
