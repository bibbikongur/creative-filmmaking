<template>
  <div>
    <!-- One column on phones; two side by side from sm, so a long table stays short.
         Every row carries its own bottom rule and the first row of each column the top one. -->
    <dl class="grid sm:grid-cols-2 sm:gap-x-10">
      <div
        v-for="row in table"
        :key="row.key"
        class="flex items-baseline justify-between gap-6 py-3 border-b border-ink-700 first:border-t sm:[&:nth-child(2)]:border-t"
      >
        <dt class="text-sm text-bone-400">{{ row.label }}</dt>
        <dd class="text-sm font-medium text-bone-100 text-right">{{ row.value }}</dd>
      </div>
    </dl>
    <!-- The free-text note has no label of its own: a line under the table, not a row in it -->
    <p v-if="note" class="mt-4 text-sm leading-relaxed text-bone-400">{{ note.value }}</p>
  </div>
</template>

<script setup lang="ts">
import type { VehicleKind, VehicleSpecs } from '~/types'

const props = defineProps<{ specs: VehicleSpecs, kind?: VehicleKind }>()

// Ordered, localized rows (shared with the key facts at the top of the page).
const rows = useSpecRows(() => props.specs, () => props.kind)
const table = computed(() => rows.value.filter(r => r.key !== 'extra'))
const note = computed(() => rows.value.find(r => r.key === 'extra'))
</script>
