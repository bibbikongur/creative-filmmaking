<template>
  <div>
    <!-- Who we are: the claim and where to go next, a photograph of the fleet at
         work beside it, and the short facts as one strip underneath. On a phone
         the photograph comes straight after the heading. -->
    <section class="wrap pt-10 lg:pt-16">
      <div class="lg:grid lg:grid-cols-12 lg:gap-x-14 lg:grid-rows-[1fr_auto]">
        <div class="lg:col-span-6 lg:self-end">
          <p class="kicker">{{ t('about.kicker') }}</p>
          <h1 class="mt-3 display 2xl:text-7xl/[1.2] [text-wrap:balance]">{{ t('about.title') }}</h1>
        </div>
        <figure class="mt-7 lg:mt-0 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:row-span-2">
          <div class="relative overflow-hidden bg-ink-900 aspect-[3/2] lg:aspect-[4/3]">
            <NuxtImg
              src="/images/about-hero.jpg"
              :alt="t('about.photoAlt')"
              class="absolute inset-0 w-full h-full object-cover object-[60%_55%]"
              sizes="xs:100vw lg:50vw"
              format="webp"
              preload
            />
          </div>
          <figcaption class="mt-2.5 text-[13px] text-bone-400">{{ t('about.photoCaption') }}</figcaption>
        </figure>
        <div class="mt-6 lg:col-span-6 lg:self-start lg:pb-8">
          <p class="max-w-xl text-[17px] lg:text-lg leading-relaxed text-bone-100/85 [text-wrap:pretty]">{{ t('about.lead') }}</p>
          <div class="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
            <NuxtLink :to="localePath('/vehicles')" class="btn-gold">
              {{ t('home.howLink') }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </NuxtLink>
            <NuxtLink :to="localePath('/equipment')" class="inline-flex items-center min-h-[2.75rem] text-sm font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors">
              {{ t('about.who2Link') }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <dl class="mt-10 lg:mt-14 grid grid-cols-2 lg:grid-cols-4 border-t border-ink-700" :aria-label="t('about.factsLabel')">
        <div v-for="fact in facts" :key="fact.label" class="border-b border-ink-700 py-4 lg:py-5 pr-4">
          <dt class="text-xs uppercase tracking-widest text-bone-400">{{ fact.label }}</dt>
          <dd class="mt-1.5 font-heading font-semibold uppercase tracking-wide text-bone-100 lg:text-lg leading-snug">{{ fact.value }}</dd>
        </div>
      </dl>
    </section>

    <!-- How we work: the one promise set large, with the background beside it -->
    <section class="wrap py-14 lg:py-20">
      <p class="kicker">{{ t('about.storyKicker') }}</p>
      <div class="mt-4 lg:grid lg:grid-cols-12 lg:gap-x-14">
        <h2 class="lg:col-span-7 lg:self-start border-l-2 border-gold-500 pl-5 lg:pl-7 font-heading font-semibold uppercase tracking-wide text-bone-100 text-2xl/[1.3] sm:text-3xl/[1.3] lg:text-4xl/[1.3] xl:text-[2.5rem]/[1.3] [text-wrap:balance]">{{ t('about.storyTitle') }}</h2>
        <div class="mt-6 lg:mt-1 lg:col-span-5">
          <p class="text-bone-400 leading-relaxed [text-wrap:pretty]">{{ t('about.story1') }}</p>
          <dl class="mt-6 grid grid-cols-[auto_1fr] gap-x-8 sm:gap-x-12 text-sm">
            <div>
              <dt class="text-xs uppercase tracking-widest text-bone-400">{{ t('contact.phoneLabel') }}</dt>
              <dd class="mt-1"><a :href="`tel:${contact.phone.replace(/\s/g, '')}`" class="inline-block py-2 -my-2 text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors whitespace-nowrap">{{ contact.phone }}</a></dd>
            </div>
            <div class="min-w-0">
              <dt class="text-xs uppercase tracking-widest text-bone-400">{{ t('contact.emailLabel') }}</dt>
              <dd class="mt-1"><a :href="`mailto:${contact.email}`" class="inline-block py-2 -my-2 text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors break-all">{{ contact.email }}</a></dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <!-- Who rents from us, each with its way in -->
    <section class="bg-ink-900 border-y border-ink-800">
      <div class="wrap py-14 lg:py-20">
      <p class="kicker">{{ t('about.whoKicker') }}</p>
      <h2 class="mt-3 font-heading font-semibold uppercase tracking-wide text-bone-100 text-3xl/[1.2] sm:text-4xl/[1.2] [text-wrap:balance]">{{ t('about.whoTitle') }}</h2>
      <div class="mt-8 grid lg:grid-cols-3 lg:gap-x-14 border-t border-ink-700">
        <div v-for="(who, n) in audiences" :key="n" class="py-6 lg:pb-0 lg:flex lg:flex-col max-lg:border-b max-lg:border-ink-700 max-lg:last:border-b-0 max-lg:last:pb-0 sm:max-lg:grid sm:max-lg:grid-cols-[14rem_1fr] sm:max-lg:gap-x-8">
          <h3 class="h3">{{ who.title }}</h3>
          <div class="mt-2 sm:max-lg:mt-0 lg:mt-3 lg:flex lg:flex-1 lg:flex-col">
            <p class="text-[15px] leading-relaxed text-bone-400 [text-wrap:pretty]">{{ who.text }}</p>
            <NuxtLink :to="who.to" class="mt-3 lg:mt-auto lg:pt-3 self-start inline-flex items-center gap-2 min-h-[2.75rem] text-sm font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors">
              {{ who.link }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
      </div>
    </section>

    <!-- How renting works: the model in one line, then the three steps, leading
         into the quote band below -->
    <section class="wrap py-14 lg:py-20">
      <div>
        <p class="kicker">{{ t('home.howKicker') }}</p>
        <h2 class="mt-3 font-heading font-semibold uppercase tracking-wide text-bone-100 text-3xl/[1.2] sm:text-4xl/[1.2] [text-wrap:balance]">{{ t('about.howTitle') }}</h2>
        <ol class="mt-7 grid lg:grid-cols-3 lg:gap-x-14">
          <li v-for="(step, n) in steps" :key="n" class="border-t border-ink-700 py-5 lg:pb-0 grid content-start grid-cols-[2.75rem_1fr] sm:max-lg:grid-cols-[2.75rem_13rem_1fr] lg:grid-cols-[2.75rem_1fr] gap-x-3 gap-y-1.5">
            <span class="font-heading font-semibold text-lg text-gold-500 tabular-nums leading-none pt-0.5" aria-hidden="true">0{{ n + 1 }}</span>
            <h3 class="font-heading font-semibold uppercase tracking-wide text-bone-100 text-lg leading-snug">{{ step.title }}</h3>
            <p class="col-start-2 sm:max-lg:col-start-3 text-[15px] leading-relaxed text-bone-400 [text-wrap:pretty]">{{ step.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <CtaBanner image="/images/home-field.jpg" :title="t('home.closeTitle')" :text="t('home.closeText')" contact />
    <QuoteBar />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const contact = useRuntimeConfig().public.contact

// The first fact is the street address (the town is its label).
const facts = computed(() => [
  { label: t('about.factBaseValue'), value: contact.address.split(',')[0]! },
  ...(['Delivery', 'Quote', 'Support'] as const).map(k => ({
    label: t(`about.fact${k}`),
    value: t(`about.fact${k}Value`),
  })),
])

const audiences = computed(() => [
  { to: localePath('/vehicles') },
  { to: localePath('/equipment') },
  { to: localePath('/contact') },
].map((a, i) => ({
  ...a,
  title: t(`about.who${i + 1}Title`),
  text: t(`about.who${i + 1}Text`),
  link: t(`about.who${i + 1}Link`),
})))

const steps = computed(() => [1, 2, 3].map(n => ({
  title: t(`home.how${n}Title`),
  text: t(`about.how${n}Text`),
})))

useSeoMeta({
  title: t('meta.about.title'),
  description: t('meta.about.description'),
  ogTitle: `${t('meta.about.title')} · Creative Filmmaking`,
  ogDescription: t('meta.about.description'),
})

useSchemaOrg([
  defineWebPage({ '@type': 'AboutPage' }),
])
</script>
