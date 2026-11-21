<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppDialog />
    <CookieConsent />
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const { t } = useI18n()

// hreflang alternates + per-locale canonical/lang attributes (from @nuxtjs/i18n).
const localeHead = useLocaleHead()

// x-default (what Google serves to a searcher whose language is neither
// Icelandic nor English) points at the English page, not the Icelandic one.
const headLinks = computed(() => {
  const links = localeHead.value.link ?? []
  const english = links.find(l => l.hreflang === 'en')
  return links.map(l => (l.hreflang === 'x-default' && english ? { ...l, href: english.href } : l))
})

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: headLinks.value,
  meta: localeHead.value.meta,
}))

// Pages set a bare title (e.g. "The Fleet"); the template appends the brand once.
// og-default.jpg (fleet photo, 1200×630) is the site-wide share image; detail
// pages with their own photos override it via useSeoMeta.
useSeoMeta({
  // The brand goes after the page title only while the whole thing still fits
  // the ~60 characters Google shows; a long title ("… 21 kW (Master BV 77 E)
  // til leigu") keeps its own words instead of being cut off mid-keyword.
  titleTemplate: (title) => {
    if (!title) return `Creative Filmmaking · ${t('meta.home.title')}`
    const branded = `${title} · Creative Filmmaking`
    return branded.length <= 60 ? branded : title
  },
  ogSiteName: 'Creative Filmmaking',
  ogType: 'website',
  ogImage: `${config.public.siteUrl}/og-default.jpg`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: () => t('meta.ogImageAlt'),
  twitterCard: 'summary_large_image',
})

// Global business identity for search engines. Vehicle nodes on detail pages
// deliberately carry no offers/prices — the business model is offer-on-request.
// Plain LocalBusiness rather than the AutoRental subtype: the catalogue is as
// much heaters, generators and traffic kit as vehicles, and the narrower type
// told Google this was a car rental when someone searched for a heater.
//
// No openingHoursSpecification: phone availability is not opening hours, and a
// 24/7 claim Google can't verify is worse than none. sameAs comes from the
// NUXT_PUBLIC_SOCIAL_* env vars (empty = omitted).
const sameAs = Object.values(config.public.social).filter(Boolean)
useSchemaOrg([
  // Defaults for every page's WebPage node: its language, and the fleet photo
  // as the main image (pages with their own photo set their own).
  defineWebPage({
    inLanguage: localeHead.value.htmlAttrs?.lang,
    primaryImageOfPage: `${config.public.siteUrl}/og-default.jpg`,
  }),
  defineLocalBusiness({
    name: 'Creative Filmmaking',
    description: t('meta.businessDescription'),
    alternateName: 'CF Rentals',
    url: config.public.siteUrl,
    // Google wants a raster logo of at least 112×112 for the knowledge panel.
    // (The library moves it to a second Organization node; the server plugin
    // schema-org-identity.ts folds that back into this one.)
    logo: `${config.public.siteUrl}/logo-512.png`,
    image: [`${config.public.siteUrl}/og-default.jpg`, `${config.public.siteUrl}/logo-512.png`],
    // Mirrors the Google Business Profile exactly (NAP consistency).
    address: {
      streetAddress: 'Grensásvegur 1',
      postalCode: '108',
      addressLocality: 'Reykjavík',
      addressCountry: 'IS',
    },
    geo: {
      latitude: config.public.contact.lat,
      longitude: config.public.contact.lng,
    },
    telephone: config.public.contact.phone,
    email: config.public.contact.email,
    priceRange: '$$',
    areaServed: { '@type': 'Country', name: 'Iceland' },
    knowsLanguage: ['is', 'en'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: config.public.contact.phone,
      email: config.public.contact.email,
      availableLanguage: ['Icelandic', 'English'],
      areaServed: 'IS',
    },
    ...(sameAs.length ? { sameAs } : {}),
  }),
])
</script>
