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
useSchemaOrg([
  defineLocalBusiness({
    '@type': 'AutoRental',
    name: 'Creative Filmmaking',
    description: t('meta.businessDescription'),
    url: config.public.siteUrl,
    logo: `${config.public.siteUrl}/logo.svg`,
    image: `${config.public.siteUrl}/logo.svg`,
    // Mirrors the Google Business Profile exactly (NAP consistency).
    address: {
      streetAddress: 'Grensásvegur 1',
      postalCode: '108',
      addressLocality: 'Reykjavík',
      addressCountry: 'IS',
    },
    geo: {
      latitude: 64.1353,
      longitude: -21.8689,
    },
    openingHoursSpecification: [
      {
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    telephone: config.public.contact.phone,
    email: config.public.contact.email,
    areaServed: 'Iceland',
  }),
])
</script>
