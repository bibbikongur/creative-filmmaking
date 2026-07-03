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
useSeoMeta({
  titleTemplate: title => (title ? `${title} · Creative Filmmaking` : `Creative Filmmaking · ${t('meta.home.title')}`),
  ogSiteName: 'Creative Filmmaking',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

// Global business identity for search engines. Vehicle nodes on detail pages
// deliberately carry no offers/prices — the business model is offer-on-request.
useSchemaOrg([
  defineLocalBusiness({
    name: 'Creative Filmmaking',
    description: 'Production vehicle rental for film & TV crews shooting in Iceland.',
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
