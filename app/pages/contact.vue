<template>
  <div>
    <section class="wrap pt-10 lg:pt-14 pb-14 lg:pb-20">
      <div>
        <p class="kicker">{{ t('contact.kicker') }}</p>
        <h1 class="mt-3 display [text-wrap:balance]">{{ t('contact.title') }}</h1>
        <p class="mt-4 max-w-xl text-[17px] lg:text-lg leading-relaxed text-bone-100/85 [text-wrap:pretty]">{{ t('contact.intro') }}</p>
      </div>

      <!-- Two ways in: the form, and the direct line. Phone: direct line, form, map.
           Tablet: direct line and map side by side, form under them. Desktop: form
           on the left, direct line and map in the column beside it. -->
      <div class="mt-8 lg:mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-14 lg:gap-y-8 lg:grid-rows-[auto_1fr]">
        <!-- Direct contact -->
        <div class="sm:max-lg:col-start-1 sm:max-lg:row-start-1 lg:col-span-5 lg:col-start-8 lg:row-start-1">
          <h2 class="h3">{{ t('contact.directTitle') }}</h2>
          <p class="mt-2 text-sm leading-relaxed text-bone-400">{{ t('contact.directText') }}</p>
          <!-- A button where a call is one tap; a large number where it is read and dialled -->
          <a
            :href="`tel:${contact.phone.replace(/\s/g, '')}`"
            class="mt-4 flex lg:inline-flex items-center justify-center lg:justify-start gap-3 min-h-[3.5rem] lg:min-h-[2.75rem] max-lg:border max-lg:border-gold-500 max-lg:px-4 font-heading font-semibold tracking-wide text-bone-100 text-2xl lg:text-3xl underline-offset-8 decoration-gold-500 decoration-2 lg:hover:underline max-lg:active:bg-gold-500/10 transition-colors"
          >
            <svg class="w-6 h-6 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {{ contact.phone }}
          </a>
          <dl class="mt-5 divide-y divide-ink-700 border-y border-ink-700 text-sm">
            <div class="grid grid-cols-[7rem_1fr] items-baseline gap-4 py-3.5">
              <dt class="text-xs uppercase tracking-widest text-bone-400">{{ t('contact.emailLabel') }}</dt>
              <dd class="min-w-0"><a :href="`mailto:${contact.email}`" class="inline-block py-2 -my-2 font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors break-all">{{ contact.email }}</a></dd>
            </div>
            <div class="grid grid-cols-[7rem_1fr] items-baseline gap-4 py-3.5">
              <dt class="text-xs uppercase tracking-widest text-bone-400">{{ t('contact.addressLabel') }}</dt>
              <dd>
                <a :href="mapsUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-2 py-2 -my-2 font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors">
                  {{ contact.address }}
                  <svg class="w-3.5 h-3.5 shrink-0 text-bone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <!-- Map: a still picture of where we are (OpenStreetMap embed: no script, no
             cookies), toned to the page, with our own pin over its centre. The frame is
             larger than the picture on every side, so the embed's zoom buttons (which
             would do nothing) and its wrapping credit line fall outside; the credit is
             set again in our own type. The picture is one link to a real maps app, so
             it never traps a scrolling finger. -->
        <figure class="relative max-sm:-mt-4 sm:max-lg:col-start-2 sm:max-lg:row-start-1 lg:col-span-5 lg:col-start-8 lg:row-start-2 flex flex-col">
          <a
            :href="mapsUrl"
            target="_blank"
            rel="noopener"
            class="group relative block flex-1 min-h-[10rem] sm:min-h-[16rem] overflow-hidden border border-ink-700 bg-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
            :aria-label="`${t('contact.openMap')}: ${contact.address}`"
          >
            <iframe
              :title="t('contact.mapTitle')"
              :src="mapSrc"
              class="absolute -left-16 -top-16 w-[calc(100%+8rem)] h-[calc(100%+8rem)] max-w-none pointer-events-none [filter:grayscale(1)_invert(.92)_contrast(.85)_brightness(.72)]"
              loading="lazy"
              tabindex="-1"
              referrerpolicy="no-referrer-when-downgrade"
            />
            <span class="absolute inset-0 bg-ink-700 mix-blend-color opacity-70" aria-hidden="true" />
            <svg class="absolute left-1/2 top-1/2 w-9 h-9 -translate-x-1/2 -translate-y-full text-gold-500 drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" />
            </svg>
            <span class="absolute left-0 top-0 inline-flex items-center gap-2 bg-ink-950/85 px-3 py-2 text-[13px] font-medium text-bone-100 group-hover:text-gold-400 group-focus-visible:text-gold-400 transition-colors">
              {{ t('contact.openMap') }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </span>
          </a>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" class="absolute right-px bottom-px bg-ink-950/85 px-2 py-1 text-[11px] text-bone-400 hover:text-bone-100 transition-colors">{{ t('contact.mapAttribution') }}</a>
        </figure>

        <!-- Form. After sending, the card holds only the confirmation, centred. -->
        <div class="sm:max-lg:col-span-2 sm:max-lg:row-start-2 lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:row-span-2 flex flex-col border border-ink-700 bg-ink-900 p-5 sm:p-8">
          <template v-if="!sent">
            <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2 class="h3">{{ t('contact.formTitle') }}</h2>
              <p class="max-sm:hidden text-[13px] text-bone-400">{{ t('form.requiredNote') }}</p>
            </div>
            <p class="mt-2 max-w-xl text-sm text-bone-400 leading-relaxed [text-wrap:balance]">{{ t('contact.formIntro') }}</p>
            <p class="sm:hidden mt-3 text-[13px] text-bone-400">{{ t('form.requiredNote') }}</p>
          </template>
          <div :class="sent ? 'flex flex-1 flex-col justify-center py-10' : 'mt-5'">
            <QuoteForm :vehicle="prefill" show-vehicle-select message-required :legend="false" @sent="sent = true" @reset="sent = false" />
          </div>
        </div>

      </div>

      <!-- The other route to a quote: the list -->
      <div class="mt-10 lg:mt-14 flex flex-wrap items-center justify-between gap-x-10 gap-y-3 border-y border-ink-700 py-5">
        <p class="text-bone-100">
          <template v-if="cart.count.value">{{ t('contact.listNote', { n: cart.count.value }, cart.count.value) }}</template>
          <template v-else>
            <span class="font-heading font-semibold uppercase tracking-wide">{{ t('contact.listTitle') }}</span>
            <span class="ml-3 max-sm:ml-0 max-sm:mt-1 max-sm:block text-sm text-bone-400">{{ t('contact.listText') }}</span>
          </template>
        </p>
        <div class="flex flex-wrap gap-x-8 gap-y-1">
          <NuxtLink v-for="link in listLinks" :key="link.to" :to="link.to" class="inline-flex items-center gap-2 min-h-[2.75rem] py-3 text-sm font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors whitespace-nowrap">
            {{ link.label }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section v-if="faqItems.length" class="bg-ink-900 border-t border-ink-800">
      <div class="wrap py-14 lg:py-20">
        <FaqSection split :kicker="t('faq.kicker')" :title="t('faq.title')" :items="faqItems">
          <p class="mt-4 text-sm leading-relaxed text-bone-400">
            {{ t('contact.faqNote') }}
            <a :href="`tel:${contact.phone.replace(/\s/g, '')}`" class="inline-block py-2 -my-2 font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors whitespace-nowrap">{{ contact.phone }}</a>
          </p>
        </FaqSection>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const cart = useCart()
const contact = useRuntimeConfig().public.contact
const { faq } = useFaq()
const faqItems = faq('faq.contact')

// Deep-link support: /contact?vehicle=<slug> preselects the vehicle.
const prefill = typeof route.query.vehicle === 'string' ? route.query.vehicle : undefined

// After sending, the form card shows only the confirmation.
const sent = ref(false)

// With something on the list the way forward is the list; otherwise the two catalogues.
const listLinks = computed(() => (cart.count.value
  ? [{ label: t('contact.listLink'), to: localePath('/cart') }]
  : [
      { label: t('nav.fleet'), to: localePath('/vehicles') },
      { label: t('nav.equipment'), to: localePath('/equipment') },
    ]))

// No marker in the embed: our own pin sits over the centre of the frame.
const { lat, lng } = contact
const d = 0.0035
const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d * 2},${lat - d},${lng + d * 2},${lat + d}&layer=mapnik`
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

useSeoMeta({
  title: t('meta.contact.title'),
  description: t('meta.contact.description'),
  ogTitle: `${t('meta.contact.title')} · Creative Filmmaking`,
  ogDescription: t('meta.contact.description'),
})

useSchemaOrg([
  defineWebPage({ '@type': faqItems.length ? ['ContactPage', 'FAQPage'] : 'ContactPage' }),
])
</script>
