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
        <p v-if="intro" class="mt-3 text-sm text-bone-400 leading-relaxed [text-wrap:pretty]">
          {{ intro }}
        </p>
      </div>

      <!-- The three steps: beside the title on a desktop, a strip on a tablet,
           a fold-out line on phones -->
      <section class="max-lg:mt-6 max-lg:border-t border-ink-700 lg:col-span-5 lg:border-l lg:pl-10" :aria-label="stepsTitle">
        <p class="hidden lg:block meta text-bone-400">{{ stepsTitle }}</p>
        <!-- One list in the HTML. On phones it sits behind this toggle. -->
        <button
          type="button"
          class="sm:hidden flex w-full items-center justify-between gap-3 min-h-[3rem] text-sm font-medium text-bone-100"
          :aria-expanded="stepsOpen"
          :aria-controls="stepsId"
          @click="stepsOpen = !stepsOpen"
        >
          {{ stepsTitle }}
          <svg class="w-4 h-4 text-bone-400 transition-transform" :class="stepsOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <ol
          :id="stepsId"
          class="max-sm:pb-4 max-sm:space-y-3 sm:grid sm:grid-cols-3 sm:divide-x divide-ink-700 lg:mt-3 lg:block lg:divide-x-0 lg:space-y-2.5"
          :class="stepsOpen ? '' : 'max-sm:hidden'"
        >
          <li v-for="(step, n) in steps" :key="n" class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 sm:py-4 sm:px-6 sm:first:pl-0 lg:p-0">
            <span class="font-heading text-base font-medium text-bone-400 tabular-nums" aria-hidden="true">0{{ n + 1 }}</span>
            <span class="font-heading font-medium uppercase tracking-wider text-sm text-bone-100">{{ step.title }}</span>
            <span class="text-sm leading-snug text-bone-400">{{ step.text }}</span>
          </li>
        </ol>
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

// Phones: the steps fold away under their title until asked for.
const stepsOpen = ref(false)
const stepsId = useId()
</script>
