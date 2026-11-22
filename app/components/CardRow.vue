<template>
  <!-- A row of related cards. Below lg it is one sideways row with the next card
       peeking in (a listing page is long enough on a phone without a stack of
       cards); from lg the cards sit four across on shared rows (subgrid), so
       names, facts and buttons line up. Exactly three cards share the row in
       thirds instead of leaving a hole where the fourth would be. Cards take
       their widths from here. -->
  <div class="-mx-4 sm:-mx-6 lg:mx-0 overflow-x-auto lg:overflow-visible snap-x snap-mandatory scroll-px-4 sm:scroll-px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <div
      class="flex gap-3 sm:gap-4 px-4 sm:px-6 py-0.5 lg:p-0 lg:grid xl:gap-5
        [&>*]:max-lg:shrink-0 [&>*]:max-lg:snap-start [&>*]:max-lg:w-[72vw] [&>*]:max-lg:sm:w-[19rem]
        [&>*]:lg:grid-rows-subgrid [&>*]:lg:row-span-4"
      :class="count === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** How many cards the row holds */
  count?: number
}>()
</script>
