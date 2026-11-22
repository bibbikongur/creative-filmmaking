<template>
  <!-- The figures a renter checks first, as tiles: seats, drive, box size. In the
       rail they sit two across (three when there are three and the screen has room,
       so no one figure gets a double-width tile for no reason; a box measurement is
       long and does take a full row). `wide` is the same set across a full column, in one row.
       `more` is for a vehicle too simple to need a spec table: what the tiles
       leave out follows as one quiet line of features. -->
  <div v-if="facts.length || more.length">
    <dl v-if="facts.length" class="grid gap-px bg-ink-700 border border-ink-700" :class="columns" :aria-label="t('listing.keyFacts')">
      <div
        v-for="(fact, n) in facts"
        :key="fact.key"
        class="min-w-0 bg-ink-950 px-3 xl:px-4 py-2.5"
        :class="[fact.key === 'box' ? 'col-span-2' : '', three && n === 2 ? 'max-[479px]:col-span-2' : '']"
      >
        <dt class="text-[11px] uppercase tracking-widest text-bone-400 truncate">{{ fact.shortLabel }}</dt>
        <dd class="mt-0.5 font-heading text-lg font-medium tracking-wide text-bone-100">{{ fact.value }}</dd>
      </div>
    </dl>
    <ul v-if="more.length" class="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-bone-100/85">
      <li v-for="row in more" :key="row.key" class="flex items-center gap-2">
        <svg v-if="row.flag" class="w-3.5 h-3.5 shrink-0 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <template v-if="row.flag">{{ row.label }}</template>
        <template v-else-if="row.key === 'extra'">{{ row.value }}</template>
        <template v-else><span class="text-bone-400">{{ row.label }}:</span> {{ row.value }}</template>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { SpecRow } from '~/composables/useSpecRows'

const props = withDefaults(defineProps<{
  /** The deciding figures (splitSpecRows) */
  facts: SpecRow[]
  /** Rows shown as a line under the tiles when the page has no spec table */
  more?: SpecRow[]
  /** Across a full column (under the photos) instead of in the rail */
  wide?: boolean
}>(), { more: () => [], wide: false })

const { t } = useI18n()

// Tracks: the box measurement counts for two.
const columns = computed(() => {
  const n = props.facts.length
  const box = props.facts.some(f => f.key === 'box')
  if (props.wide) return box ? 'grid-cols-4' : n >= 4 ? 'grid-cols-4' : n === 3 ? 'grid-cols-3' : n === 2 ? 'grid-cols-2' : 'grid-cols-1'
  if (box) return 'grid-cols-2'
  // Three across needs about 480px of phone (a long Icelandic value is 93px wide):
  // narrower, two across and the third along the foot.
  return n === 3 ? 'grid-cols-2 min-[480px]:grid-cols-3' : n === 1 ? 'grid-cols-1' : 'grid-cols-2'
})
const three = computed(() => !props.wide && props.facts.length === 3 && !props.facts.some(f => f.key === 'box'))
</script>
