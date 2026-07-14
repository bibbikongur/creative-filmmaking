<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
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
// The ogImage here is the site-wide fallback — pages with a better image
// (home hero, vehicle photos) override it with their own useSeoMeta call.
useSeoMeta({
  titleTemplate: title => (title ? `${title} · Creative Filmmaking` : `Creative Filmmaking · ${t('meta.home.title')}`),
  ogSiteName: 'Creative Filmmaking',
  ogType: 'website',
  ogImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
  ogImageAlt: 'Creative Filmmaking · Production vehicle rental in Iceland',
  twitterCard: 'summary_large_image',
})

// Global business identity for search engines. Vehicle nodes on detail pages
// deliberately carry no offers/prices — the business model is offer-on-request.
useSchemaOrg([
  defineLocalBusiness({
    name: 'Creative Filmmaking',
    description: 'Production vehicle rental for film & TV crews shooting in Iceland.',
    url: config.public.siteUrl,
    logo: `${config.public.siteUrl}/logo.svg`,
    image: `${config.public.siteUrl}/logo.svg`,
    address: {
      addressLocality: 'Reykjavík',
      addressCountry: 'IS',
    },
    telephone: config.public.contact.phone,
    email: config.public.contact.email,
    areaServed: 'Iceland',
  }),
])
</script>
