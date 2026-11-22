<template>
  <!-- Where a price would be on a listing: the two ways to get one, what the second
       button is for, and what happens next. Kept short: on a laptop the buttons
       have to be on screen before any scrolling. -->
  <div>
    <div class="panel border-t-2 border-t-gold-500 !p-5">
      <p class="font-heading text-lg font-semibold uppercase tracking-wide text-bone-100">{{ t('catalogue.priceOnQuote') }}</p>
      <ListingActions id="listing-actions" :type="type" :item-id="id" :max="max" class="mt-3.5" />

      <!-- The second button explained; with a list under way, where it stands -->
      <!-- (left out on a very short desktop window, where the rail has to fit under the header) -->
      <p class="mt-3.5 text-[13px] leading-relaxed text-bone-400 lg:[@media(max-height:640px)]:hidden" aria-live="polite">
        <template v-if="inCart">{{ t('listing.onList') }}</template>
        <template v-else-if="cart.count.value">
          {{ t('listing.listHas', { n: cart.count.value }, cart.count.value) }}
          <NuxtLink :to="localePath('/cart')" class="ml-1 font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors whitespace-nowrap">{{ t('equipmentCatalogue.browser.listOpen') }}</NuxtLink>
        </template>
        <template v-else>{{ t('listing.listHint') }}</template>
      </p>
    </div>

    <!-- Service promises as one quiet line (the ticks belong to the item's own highlights).
         Each carries its own marker and its own line: three would not fit on one,
         and two and one reads as an accident. -->
    <ul class="mt-3.5 flex flex-col gap-y-1 text-[13px] leading-relaxed text-bone-400">
      <li v-for="line in assurances" :key="line" class="flex items-baseline gap-2">
        <span class="block w-1 h-1 shrink-0 -translate-y-0.5 bg-gold-500" aria-hidden="true" />{{ line }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { CartItemType } from '~/types'

const props = defineProps<{
  type: CartItemType
  id: string
  /** How many can be asked for: a vehicle's unit count */
  max?: number
}>()

const { t, tm, rt } = useI18n()
const localePath = useLocalePath()
const cart = useCart()

const inCart = computed(() => cart.has(props.type, props.id))
const assurances = computed(() => (tm('listing.assurances') as unknown[]).map(line => rt(line as string)))
</script>
