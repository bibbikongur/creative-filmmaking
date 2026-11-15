<template>
  <div
    v-if="inCart && multiple"
    class="items-stretch border border-gold-500/60 text-gold-400"
    :class="[compact ? 'text-xs min-h-[2.25rem] max-sm:min-h-[2.75rem]' : 'text-sm min-h-[2.75rem]', block ? 'flex w-full' : 'inline-flex', 'justify-between']"
    @click.stop
  >
    <!-- Already on the list and rentable in multiples (equipment, or a vehicle that
         exists in several identical units): quantity stepper instead of a toggle.
         (Comments live inside the elements: the component must keep a single root
         so the caller's classes, e.g. "relative z-10", land on it.) -->
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
    <span class="px-1 min-w-[1.5rem] inline-flex items-center justify-center font-semibold tabular-nums whitespace-nowrap" aria-live="polite"><template v-if="max">{{ t('cart.ofMax', { qty, max }) }}</template><template v-else>{{ qty }}</template></span>
    <button
      type="button"
      class="min-w-[2.25rem] px-2 inline-flex items-center justify-center hover:bg-gold-500/10 transition-colors disabled:opacity-35 disabled:hover:bg-transparent"
      :aria-label="t('cart.increase')"
      :disabled="atMax"
      @click="cart.setQty(type, id, qty + 1)"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </div>

  <button
    v-else
    type="button"
    class="group/add"
    :class="[inCart ? 'btn-selected' : (primary ? 'btn-gold' : 'btn-outline'), compact ? 'btn-sm max-sm:min-h-[2.75rem]' : '', block ? 'w-full !px-2' : '', iconOnlyMobile ? 'max-sm:w-11 max-sm:!px-0' : '']"
    :aria-label="inCart ? `${t('cart.added')}. ${t('cart.remove')}` : t('cart.add')"
    :aria-pressed="inCart"
    @click.stop="inCart ? cart.remove(type, id) : cart.add(type, id)"
  >
    <!-- Toggle. On the list it reads "on the list"; where a pointer can hover it
         says what a click does ("remove") while hovered. -->
    <template v-if="inCart">
      <svg class="w-3.5 h-3.5 [@media(hover:hover)]:group-hover/add:hidden group-focus-visible/add:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
      </svg>
      <svg class="w-3.5 h-3.5 hidden [@media(hover:hover)]:group-hover/add:block group-focus-visible/add:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 6l12 12M18 6L6 18" />
      </svg>
      <span :class="iconOnlyMobile ? 'max-sm:hidden' : ''">
        <span class="[@media(hover:hover)]:group-hover/add:hidden group-focus-visible/add:hidden">{{ t('cart.added') }}</span>
        <span class="hidden [@media(hover:hover)]:group-hover/add:inline group-focus-visible/add:inline">{{ t('cart.remove') }}</span>
      </span>
    </template>
    <template v-else>
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
      </svg>
      <span :class="iconOnlyMobile ? 'max-sm:hidden' : ''">{{ t('cart.add') }}</span>
    </template>
  </button>
</template>

<script setup lang="ts">
import type { CartItemType } from '~/types'

const props = defineProps<{
  type: CartItemType
  id: string
  /** Smaller sizing for catalogue cards */
  compact?: boolean
  /** Fills the width of its container (dense catalogue cards) */
  block?: boolean
  /** Icon-only below the sm breakpoint (one-line list rows) */
  iconOnlyMobile?: boolean
  /** Filled gold "add" (the main action of a catalogue row) instead of the outline */
  primary?: boolean
  /** How many can be asked for: a vehicle's unit count. Equipment has no cap. */
  max?: number
}>()

const { t } = useI18n()
const cart = useCart()

const inCart = computed(() => cart.has(props.type, props.id))
const qty = computed(() => cart.entries.value.find(e => e.type === props.type && e.id === props.id)?.qty ?? 1)
// Equipment always rents in multiples; a vehicle only when the fleet has several of it.
const multiple = computed(() => props.type === 'equipment' || (props.max ?? 1) > 1)
const atMax = computed(() => !!props.max && qty.value >= props.max)
</script>
