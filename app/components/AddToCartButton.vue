<template>
  <!-- Equipment already on the list: quantity stepper instead of a toggle -->
  <div
    v-if="inCart && type === 'equipment'"
    class="inline-flex items-center border border-gold-500/60 text-gold-400"
    :class="compact ? 'text-xs' : 'text-sm'"
    @click.prevent.stop
  >
    <button
      type="button"
      class="px-2.5 py-1.5 hover:bg-gold-500/10 transition-colors"
      :aria-label="t('cart.decrease')"
      @click="qty > 1 ? cart.setQty(type, id, qty - 1) : cart.remove(type, id)"
    >
      −
    </button>
    <span class="px-1 min-w-[1.5rem] text-center font-semibold tabular-nums">{{ qty }}</span>
    <button
      type="button"
      class="px-2.5 py-1.5 hover:bg-gold-500/10 transition-colors"
      :aria-label="t('cart.increase')"
      @click="cart.add(type, id)"
    >
      +
    </button>
  </div>

  <button
    v-else
    type="button"
    class="inline-flex items-center gap-1.5 font-heading font-semibold uppercase tracking-wider transition-colors"
    :class="[
      compact ? 'text-xs px-3 py-1.5' : 'text-sm px-5 py-2.5',
      inCart
        ? 'border border-gold-500/60 text-gold-400 hover:text-signal-500 hover:border-signal-500/60'
        : 'border border-bone-400/40 text-bone-100 hover:border-gold-500 hover:text-gold-400',
    ]"
    :title="inCart ? t('cart.remove') : t('cart.add')"
    @click.prevent.stop="inCart ? cart.remove(type, id) : cart.add(type, id)"
  >
    <svg v-if="inCart" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
    </svg>
    <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
    {{ inCart ? t('cart.added') : t('cart.add') }}
  </button>
</template>

<script setup lang="ts">
import type { CartItemType } from '~/types'

const props = defineProps<{
  type: CartItemType
  id: string
  /** Smaller sizing for catalogue cards */
  compact?: boolean
}>()

const { t } = useI18n()
const cart = useCart()

const inCart = computed(() => cart.has(props.type, props.id))
const qty = computed(() => cart.entries.value.find(e => e.type === props.type && e.id === props.id)?.qty ?? 1)
</script>
