<template>
  <section class="relative overflow-hidden bg-ink-900 bg-hero-vignette border-y border-ink-800">
    <div class="wrap section-sm">
      <div class="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-16">
        <div class="flex-1">
          <h2 class="h2">
            {{ cart.count.value ? t('cta.listTitle') : (title || t('cta.title')) }}
          </h2>
          <p class="mt-4 text-bone-400 max-w-2xl leading-relaxed">
            {{ cart.count.value ? t('cta.listText', { n: cart.count.value }) : (text || t('cta.text')) }}
          </p>
        </div>
        <NuxtLink :to="localePath(cart.count.value ? '/cart' : '/contact')" class="btn-gold shrink-0">
          {{ cart.count.value ? t('equipmentCatalogue.browser.listCta') : (button || t('cta.button')) }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Pages whose audience is wider than film crews pass their own copy.
defineProps<{ title?: string, text?: string, button?: string }>()
// With something on the quote list, the way forward is sending that list.
const cart = useCart()

const { t } = useI18n()
const localePath = useLocalePath()
</script>
