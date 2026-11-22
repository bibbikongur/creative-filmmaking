<template>
  <!-- A listing page's stage (vehicle or equipment item).

       Phones read it top to bottom: photos, title, key facts, quote box, details.

       From lg the title and the quote box are a rail on the right that stays in view
       while the photos and the details scroll past on the left: the name and the way
       to ask for a quote are never off screen. The key facts ride at the foot of that
       rail where the window is tall enough to show the whole of it; on a shorter
       window (most laptops) they sit under the photos instead, so the rail is short
       enough to pin there too. The switch is by window height in CSS, the same on
       every page; `tight` is the rare page whose rail is too tall even for a tall window. -->
  <div class="grid gap-y-8 lg:grid-cols-12 lg:gap-x-10 xl:gap-x-16 lg:grid-rows-[auto_1fr]">
    <div class="min-w-0 lg:col-start-1 lg:col-span-7 lg:row-start-1">
      <slot name="gallery" />
    </div>

    <div class="min-w-0 lg:col-start-8 lg:col-span-5 lg:row-start-1 lg:row-span-2">
      <!-- On a very short window the rail pins closer under the header, to keep its foot on screen -->
      <div ref="rail" class="flex flex-col lg:[@media(min-height:560px)]:sticky lg:top-20 xl:top-24 lg:[@media(max-height:680px)]:top-[4.5rem] xl:[@media(max-height:680px)]:top-[5.5rem]">
        <div class="order-1"><slot name="title" /></div>
        <div class="order-3 lg:order-2 mt-5"><slot name="quote" /></div>
        <div
          v-if="$slots.facts"
          class="order-2 lg:order-3 mt-5 lg:[@media(max-height:859px)]:hidden"
          :class="tight ? 'lg:hidden' : ''"
        >
          <slot name="facts" :wide="false" />
        </div>
      </div>
    </div>

    <div class="min-w-0 lg:col-start-1 lg:col-span-7 lg:row-start-2">
      <!-- The same key facts, across the column under the photos (short windows only) -->
      <div
        v-if="$slots.facts"
        class="hidden mb-10 lg:[@media(max-height:859px)]:block"
        :class="tight ? 'lg:block' : ''"
      >
        <slot name="facts" :wide="true" />
      </div>
      <slot name="details" />
    </div>
  </div>
</template>

<script setup lang="ts">
const rail = ref<HTMLElement | null>(null)
// A tall window whose rail still does not fit under the header (a long name and a
// long lead at once): the facts move under the photos there as well.
const tight = ref(false)
// The rail's height with the facts in it, kept from the last time they were.
let fullHeight = 0

const measure = () => {
  if (!rail.value) return
  // Below lg there is no rail, and on short windows the CSS has already moved the facts.
  if (window.innerWidth < 1024 || window.innerHeight < 860) {
    tight.value = false
    return
  }
  if (!tight.value) fullHeight = rail.value.offsetHeight
  // The header's height plus the gap under it (lg:top-20 / xl:top-24), and a little air below.
  const offset = window.innerWidth >= 1280 ? 96 : 80
  tight.value = fullHeight + offset + 16 > window.innerHeight
}

onMounted(() => {
  measure()
  window.addEventListener('resize', measure, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))
</script>
