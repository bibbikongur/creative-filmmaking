<template>
  <NuxtLayout>
    <div class="wrap section flex items-center justify-center min-h-[60vh]">
      <div class="text-center max-w-lg">
        <p class="kicker">{{ is404 ? t('error.kicker') : '' }}</p>
        <h1 class="h1 mt-4">
          {{ is404 ? t('error.title') : t('error.genericTitle') }}
        </h1>
        <p class="mt-5 text-bone-400 leading-relaxed">
          {{ is404 ? t('error.text') : t('error.genericText') }}
        </p>
        <button type="button" class="btn-gold mt-9" @click="handleError">
          {{ t('error.button') }}
        </button>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const localePath = useLocalePath()

const is404 = computed(() => props.error.statusCode === 404)

const handleError = () => clearError({ redirect: localePath('/vehicles') })

useSeoMeta({
  title: () => (is404.value ? t('error.title') : t('error.genericTitle')),
  robots: 'noindex',
})
</script>
