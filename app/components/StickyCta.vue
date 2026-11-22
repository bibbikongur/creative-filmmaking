<template>
  <!-- The listing's actions pinned to the foot of the window, at every width, whenever
       the page's own copy of them (the quote box) and the enquiry form are both off
       screen: so there is always one tap to a quote. It steps aside for the footer. On a desktop it names the item
       beside the buttons; on a phone the buttons take the whole bar. -->
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="translate-y-full"
    leave-active-class="transition duration-100 ease-in"
    leave-to-class="translate-y-full"
  >
    <div v-if="show" class="fixed bottom-0 inset-x-0 z-40 bg-ink-950/95 backdrop-blur border-t border-ink-700">
      <div class="wrap flex items-center gap-5 py-3 max-lg:!px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div class="hidden lg:flex min-w-0 flex-1 items-center gap-4">
          <ListingThumb v-if="image" :src="image" :fit="fit" />
          <div class="min-w-0">
            <p class="font-heading font-medium uppercase tracking-wide text-base leading-snug text-bone-100 truncate">{{ name }}</p>
            <p class="text-[11px] uppercase tracking-widest text-bone-400">{{ t('catalogue.priceOnQuote') }}</p>
          </div>
        </div>
        <ListingActions :type="type" :item-id="id" :max="max" bar class="max-lg:flex-1" />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { CartItemType } from '~/types'

const props = defineProps<{
  type: CartItemType
  id: string
  /** How many can be asked for: a vehicle's unit count */
  max?: number
  name: string
  image?: string
  fit?: 'cover' | 'contain'
  /** Ids of the elements that make the bar redundant while on screen (the in-page buttons, the form) */
  hideBeside: string[]
}>()

const { t } = useI18n()

// Which of those elements are on screen now. Hidden until measured, so the bar
// never flashes over a first screen that already shows the buttons.
const inView = reactive(new Set<Element>())
const measured = ref(false)
const show = computed(() => measured.value && inView.size === 0)
let observer: IntersectionObserver | null = null

onMounted(() => {
  // The footer counts too: the bar never sits over the contact details and the legal line.
  const targets = [...props.hideBeside.map(id => document.getElementById(id)), document.querySelector<HTMLElement>('footer')]
    .filter((el): el is HTMLElement => Boolean(el))
  if (!targets.length || !('IntersectionObserver' in window)) return
  // The top margin is the fixed header: buttons that have slid under it are not "on screen".
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) inView.add(entry.target)
      else inView.delete(entry.target)
    }
    measured.value = true
  }, { rootMargin: '-80px 0px 0px 0px', threshold: 0.05 })
  targets.forEach(el => observer!.observe(el))
})

// While the bar is up, keyboard focus and anchor jumps keep clear of it.
watch(show, (on) => {
  document.documentElement.style.scrollPaddingBottom = on ? '5rem' : ''
})

onBeforeUnmount(() => {
  observer?.disconnect()
  document.documentElement.style.scrollPaddingBottom = ''
})
</script>
