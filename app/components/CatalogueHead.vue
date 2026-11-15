<template>
  <!-- Head of a catalogue hub (fleet, equipment): what this is, and how renting
       works when no prices are listed. On a desktop the three steps sit beside
       the title, so the catalogue starts higher up the page. -->
  <header class="bg-ink-900 bg-hero-vignette border-b border-ink-800">
    <div class="wrap pt-8 lg:pt-10 lg:pb-10 lg:grid lg:grid-cols-12 lg:gap-12 lg:items-end">
      <div class="lg:col-span-7 max-w-3xl">
        <p class="kicker">{{ kicker }}</p>
        <h1 class="h1 mt-3">{{ title }}</h1>
        <!-- The one thing a visitor has to know before browsing a catalogue without prices -->
        <p class="mt-4 text-lg sm:text-xl leading-snug font-medium text-bone-100 [text-wrap:balance]">
          {{ lead }}
        </p>
        <p class="mt-1.5 text-bone-100 leading-relaxed">
          {{ note }}
        </p>
        <p v-if="intro" class="max-sm:hidden mt-3 text-sm text-bone-400 leading-relaxed [text-wrap:pretty]">
          {{ intro }}
        </p>
      </div>

      <!-- The three steps: beside the title on a desktop, a strip on a tablet,
           a fold-out line on phones -->
      <section class="max-lg:mt-6 max-lg:border-t border-ink-700 lg:col-span-5 lg:border-l lg:pl-10" :aria-label="stepsTitle">
        <p class="hidden lg:block meta text-bone-400">{{ stepsTitle }}</p>
        <ol class="hidden sm:grid grid-cols-3 divide-x divide-ink-700 lg:mt-3 lg:block lg:divide-x-0 lg:space-y-2.5">
          <li v-for="(step, n) in steps" :key="n" class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-4 px-6 first:pl-0 lg:p-0">
            <span class="font-heading text-base font-medium text-bone-400 tabular-nums" aria-hidden="true">0{{ n + 1 }}</span>
            <span class="font-heading font-medium uppercase tracking-wider text-sm text-bone-100">{{ step.title }}</span>
            <span class="text-sm leading-snug text-bone-400">{{ step.text }}</span>
          </li>
        </ol>
        <details class="sm:hidden group">
          <summary class="flex items-center justify-between gap-3 min-h-[3rem] cursor-pointer list-none text-sm font-medium text-bone-100 [&::-webkit-details-marker]:hidden">
            {{ stepsTitle }}
            <svg class="w-4 h-4 text-bone-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <ol class="pb-4 space-y-3">
            <li v-for="(step, n) in steps" :key="n" class="flex items-start gap-3">
              <span class="w-6 shrink-0 font-heading text-base font-medium text-bone-400 tabular-nums leading-snug" aria-hidden="true">0{{ n + 1 }}</span>
              <p class="text-sm leading-snug text-bone-400">
                <span class="font-medium text-bone-100">{{ step.title }}.</span> {{ step.text }}
              </p>
            </li>
          </ol>
        </details>
      </section>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  kicker: string
  title: string
  /** The promise: one quote, within a business day */
  lead: string
  /** The no-prices sentence that explains the list */
  note: string
  intro?: string
  stepsTitle: string
  steps: { title: string, text: string }[]
}>()
</script>
