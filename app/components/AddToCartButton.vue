<template>
  <!-- Equipment already on the list: quantity stepper instead of a toggle -->
  <div
    v-if="inCart && type === 'equipment'"
    class="inline-flex items-stretch border border-gold-500/60 text-gold-400"
    :class="compact ? 'text-xs min-h-[2.25rem]' : 'text-sm min-h-[2.75rem]'"
    @click.stop
  >
    <button
      type="button"
      class="min-w-[2.25rem] px-2 inline-flex items-center justify-center hover:bg-gold-500/10 transition-colors"
      :aria-label="qty > 1 ? t('cart.decrease') : t('cart.remove')"
      @click="qty > 1 ? cart.setQty(type, id, qty - 1) : cart.remove(type, id)"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" />
      </svg>
    </button>
    <span class="px-1 min-w-[1.5rem] inline-flex items-center justify-center font-semibold tabular-nums" aria-live="polite">{{ qty }}</span>
    <button
      type="button"
      class="min-w-[2.25rem] px-2 inline-flex items-center justify-center hover:bg-gold-500/10 transition-colors"
      :aria-label="t('cart.increase')"
      @click="cart.add(type, id)"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </div>

  <button
    v-else
    type="button"
    :class="[inCart ? 'btn-selected' : 'btn-outline', compact ? 'btn-sm' : '']"
    :title="inCart ? t('cart.remove') : t('cart.add')"
    :aria-pressed="inCart"
    @click.stop="inCart ? cart.remove(type, id) : cart.add(type, id)"
  >
    <svg v-if="inCart" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
    </svg>
    <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
