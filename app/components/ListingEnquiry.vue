<template>
  <!-- The enquiry band of a listing page. Full width, on the alternate surface, so it
       reads as its own chapter between the details and the related items. On a
       desktop the heading, what happens after sending (three steps) and the direct
       line sit left of the form. On a phone the form comes straight after the
       heading, so the button that jumps here lands on the first field, and the
       steps follow it. -->
  <section id="request-offer" class="scroll-mt-16 xl:scroll-mt-20 bg-ink-900 border-y border-ink-800" :aria-labelledby="headingId">
    <div class="wrap py-8 sm:py-12 lg:py-16 grid gap-y-6 lg:gap-y-8 lg:grid-cols-12 lg:gap-x-10 xl:gap-x-16 lg:grid-rows-[auto_1fr]">
      <div class="lg:col-start-1 lg:col-span-5 lg:row-start-1">
        <p class="kicker max-lg:hidden">{{ t('home.howKicker') }}</p>
        <h2 :id="headingId" class="h2 lg:mt-3">{{ t('vehicle.requestTitle') }}</h2>
        <p class="mt-2 sm:mt-4 max-w-md text-sm sm:text-base text-bone-400 leading-relaxed">{{ t('vehicle.requestIntro') }}</p>
      </div>

      <div class="lg:col-start-6 lg:col-span-7 lg:row-start-1 lg:row-span-2">
        <div class="panel">
          <!-- What the enquiry is about, so nobody has to type the item's name -->
          <div class="flex items-center gap-4 pb-5 mb-6 border-b border-ink-700">
            <ListingThumb v-if="image" :src="image" :fit="fit" />
            <div class="min-w-0">
              <p class="text-[11px] uppercase tracking-widest text-bone-400">{{ t('form.vehicle') }}</p>
              <p class="mt-0.5 font-heading font-medium uppercase tracking-wide text-base leading-snug text-bone-100">{{ name }}</p>
            </div>
          </div>

          <!-- With a list under way this form would send one item of several: point at the list -->
          <div v-if="cart.count.value" class="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border border-gold-500/40 bg-gold-500/[0.07] px-4 py-3">
            <p class="min-w-0 flex-1 basis-60 text-sm leading-relaxed text-bone-100">{{ t('contact.listNote', { n: cart.count.value }, cart.count.value) }}</p>
            <NuxtLink :to="localePath('/cart')" class="btn-outline btn-sm shrink-0 whitespace-nowrap">
              {{ t('listing.sendList', { n: cart.count.value }) }}
            </NuxtLink>
          </div>

          <QuoteForm :interest="name" message-required />
        </div>
      </div>

      <div class="lg:col-start-1 lg:col-span-5 lg:row-start-2">
        <ol class="max-w-md border-t border-ink-700" :aria-label="t('home.howKicker')">
          <li v-for="(step, n) in steps" :key="n" class="flex gap-5 py-4 border-b border-ink-700">
            <span class="w-7 shrink-0 font-heading text-xl font-medium leading-6 text-gold-500 tabular-nums" aria-hidden="true">0{{ n + 1 }}</span>
            <div>
              <p class="font-heading font-medium uppercase tracking-wider text-sm leading-6 text-bone-100">{{ step.title }}</p>
              <p class="mt-0.5 text-sm leading-relaxed text-bone-400">{{ step.text }}</p>
            </div>
          </li>
        </ol>

        <div class="mt-8">
          <p class="h4">{{ t('home.contactTitle') }}</p>
          <p class="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <a :href="`tel:${contact.phone.replace(/\s/g, '')}`" class="inline-flex items-center min-h-[2.75rem] font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors whitespace-nowrap">{{ contact.phone }}</a>
            <a :href="`mailto:${contact.email}`" class="inline-flex items-center min-h-[2.75rem] font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors">{{ contact.email }}</a>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  /** Display name of the item the enquiry is about */
  name: string
  /** Its first photo, shown small beside the name */
  image?: string
  fit?: 'cover' | 'contain'
}>()

const { t, tm, rt } = useI18n()
const localePath = useLocalePath()
const contact = useRuntimeConfig().public.contact
const cart = useCart()
const headingId = useId()

const steps = computed(() => (tm('listing.steps') as { title: string, text: string }[]).map(s => ({ title: rt(s.title), text: rt(s.text) })))
</script>
