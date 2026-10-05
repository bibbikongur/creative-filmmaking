<template>
  <!-- Mobile-only bar pinned to the bottom; hides itself while the target section is on screen -->
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="translate-y-full"
    leave-active-class="transition duration-100 ease-in"
    leave-to-class="translate-y-full"
  >
    <div v-if="!targetVisible" class="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-ink-950/90 backdrop-blur border-t border-ink-800 p-3">
      <a :href="href" class="btn-gold w-full">
        {{ label }}
      </a>
    </div>
  </Transition>
  <div class="h-16 lg:hidden" aria-hidden="true" />
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Anchor the button jumps to, e.g. "#request-offer" */
  href: string
  label: string
}>()

const targetVisible = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  const id = props.href.startsWith('#') ? props.href.slice(1) : ''
  const target = id ? document.getElementById(id) : null
  if (!target || !('IntersectionObserver' in window)) return
  observer = new IntersectionObserver(([entry]) => {
    targetVisible.value = !!entry?.isIntersecting
  }, { threshold: 0.15 })
  observer.observe(target)
})

onBeforeUnmount(() => observer?.disconnect())
</script>
