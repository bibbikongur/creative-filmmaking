<template>
  <section class="relative overflow-hidden bg-ink-900 border-y border-ink-800" :class="image ? '' : 'bg-hero-vignette'">
    <!-- With a photograph the band is the page's last picture, darkened for the text -->
    <template v-if="image">
      <!-- The picture takes the right half on a desktop and fades into the band on its left;
           on small screens it is a clean band above the text. -->
      <NuxtImg :src="image" alt="" class="block w-full object-cover object-[60%_62%] max-lg:aspect-[16/9] sm:max-lg:aspect-[5/2] lg:absolute lg:inset-y-0 lg:right-0 lg:h-full lg:w-[62%]" sizes="xs:100vw sm:100vw md:100vw lg:65vw xl:65vw" format="webp" loading="lazy" />
      <div class="absolute inset-0 hidden lg:block bg-[linear-gradient(to_right,theme(colors.ink.900)_0%,theme(colors.ink.900)_41%,rgba(20,27,34,0.72)_58%,rgba(20,27,34,0.15)_82%,rgba(20,27,34,0)_100%)]" aria-hidden="true" />
    </template>
    <div class="relative wrap" :class="image ? 'py-10 sm:py-12 lg:py-0 lg:min-h-[22rem] lg:flex lg:items-center' : 'section-sm'">
      <div class="flex flex-col gap-7" :class="image ? 'lg:max-w-[46%] lg:py-16' : 'lg:flex-row lg:items-center lg:gap-16'">
        <div class="flex-1">
          <h2 :class="image ? 'font-heading font-semibold uppercase tracking-wide text-bone-100 text-3xl/[1.2] sm:text-4xl/[1.2] [text-wrap:balance]' : 'h2'">
            {{ cart.count.value ? t('cta.listTitle') : (title || t('cta.title')) }}
          </h2>
          <p class="mt-4 max-w-2xl leading-relaxed" :class="image ? 'text-bone-100/85' : 'text-bone-400'">
            {{ cart.count.value ? t('cta.listText', { n: cart.count.value }) : (text || t('cta.text')) }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-x-7 gap-y-3 shrink-0 self-start">
        <NuxtLink :to="localePath(cart.count.value ? '/cart' : '/contact')" class="btn-gold">
          {{ cart.count.value ? t('equipmentCatalogue.browser.listCta') : (button || t('cta.button')) }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
        <!-- The direct line, on pages that have no contact block of their own -->
        <p v-if="contact" class="text-sm text-bone-100/85">
          {{ t('about.callUs') }}:
          <a :href="`tel:${details.phone.replace(/s/g, '')}`" class="ml-1 font-medium text-bone-100 underline decoration-bone-400 underline-offset-4 hover:decoration-bone-100 transition-colors whitespace-nowrap">{{ details.phone }}</a>
        </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Pages whose audience is wider than film crews pass their own copy.
defineProps<{ title?: string, text?: string, button?: string, image?: string, contact?: boolean }>()
const details = useRuntimeConfig().public.contact
// With something on the quote list, the way forward is sending that list.
const cart = useCart()

const { t } = useI18n()
const localePath = useLocalePath()
</script>
