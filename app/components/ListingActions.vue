<template>
  <!-- The two ways forward from a listing, side by side. Until the item is on the
       quote list the main one asks about this item alone; once it is on the list
       the main one sends the list, so both routes end in the same place.
       `bar` is the pinned strip: one row, sized to its labels. -->
  <div :class="bar ? 'flex gap-2' : 'grid gap-3 sm:grid-cols-2 lg:max-xl:grid-cols-1'">
    <NuxtLink v-if="inCart" :to="localePath('/cart')" class="btn-gold whitespace-nowrap" :class="bar ? 'flex-1 lg:flex-none !px-4' : ''">
      {{ t('listing.sendList', { n: cart.count.value }) }}
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </NuxtLink>
    <a v-else href="#request-offer" class="btn-gold whitespace-nowrap" :class="bar ? 'flex-1 lg:flex-none !px-4' : ''">
      {{ t('common.requestOffer') }}
    </a>
    <AddToCartButton :type="type" :id="itemId" :max="max" :block="!bar" :class="bar ? 'shrink-0 !px-4 whitespace-nowrap' : ''" />
  </div>
</template>

<script setup lang="ts">
import type { CartItemType } from '~/types'

const props = defineProps<{
  type: CartItemType
  /** The catalogue item (the element id attribute falls through to the root) */
  itemId: string
  /** How many can be asked for: a vehicle's unit count */
  max?: number
  /** Laid out for the pinned bar */
  bar?: boolean
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const cart = useCart()
const inCart = computed(() => cart.has(props.type, props.itemId))
</script>
