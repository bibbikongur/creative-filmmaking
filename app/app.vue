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

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: localeHead.value.link,
  meta: localeHead.value.meta,
}))

// Pages set a bare title (e.g. "The Fleet"); the template appends the brand once.
// og-default.jpg (fleet photo, 1200×630) is the site-wide share image; detail
// pages with their own photos override it via useSeoMeta.
useSeoMeta({
  titleTemplate: title => (title ? `${title} · Creative Filmmaking` : `Creative Filmmaking · ${t('meta.home.title')}`),
  ogSiteName: 'Creative Filmmaking',
  ogType: 'website',
  ogImage: `${config.public.siteUrl}/og-default.jpg`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
})

// Global business identity for search engines. Vehicle nodes on detail pages
// deliberately carry no offers/prices — the business model is offer-on-request.
// AutoRental is the schema.org LocalBusiness subtype for vehicle rental.
//
// No openingHoursSpecification: phone availability is not opening hours, and a
// 24/7 claim Google can't verify is worse than none. sameAs comes from the
// NUXT_PUBLIC_SOCIAL_* env vars (empty = omitted).
const sameAs = Object.values(config.public.social).filter(Boolean)
useSchemaOrg([
  defineLocalBusiness({
    '@type': 'AutoRental',
    name: 'Creative Filmmaking',
    description: t('meta.businessDescription'),
    url: config.public.siteUrl,
    // Google wants a raster logo of at least 112×112 for the knowledge panel.
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
    areaServed: 'Iceland',
    ...(sameAs.length ? { sameAs } : {}),
  }),
])
</script>
