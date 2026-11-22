<template>
  <!-- The item's first photo, small: beside its name in the enquiry panel and in the
       pinned bar. An equipment cut-out sits on the pale tile; a photograph fills the frame. -->
  <div class="shrink-0 w-[4.5rem] aspect-[3/2] overflow-hidden" :class="cutout ? 'bg-bone-100' : 'bg-ink-900'">
    <NuxtImg
      ref="image"
      :src="src"
      :provider="imgProvider(src)"
      alt=""
      class="w-full h-full"
      :class="cutout ? 'object-contain p-0.5 mix-blend-multiply' : 'object-cover'"
      sizes="96px"
      format="webp"
      loading="lazy"
      @load="probe"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ src: string, fit?: 'cover' | 'contain' }>()

const image = ref<{ $el: HTMLImageElement } | null>(null)
const photo = ref(false)
const cutout = computed(() => props.fit === 'contain' && !photo.value)
const probe = () => {
  const img = image.value?.$el
  if (props.fit === 'contain' && img instanceof HTMLImageElement) photo.value = isFramePhotograph(img)
}
// An image that finished loading before the page came alive never fires "load" here.
onMounted(() => nextTick(probe))
</script>
