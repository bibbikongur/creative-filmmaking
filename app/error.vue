<template>
  <div class="min-h-screen flex flex-col bg-ink-950">
    <SiteHeader />
    <main class="flex-1 flex items-center justify-center px-4 py-24">
      <div class="text-center max-w-lg">
        <p class="kicker">{{ is404 ? t('error.kicker') : '' }}</p>
        <h1 class="mt-4 text-5xl sm:text-6xl font-semibold uppercase tracking-wide text-bone-100">
          {{ is404 ? t('error.title') : t('error.genericTitle') }}
        </h1>
        <p class="mt-5 text-bone-400 leading-relaxed">
          {{ is404 ? t('error.text') : t('error.genericText') }}
        </p>
        <button type="button" class="btn-gold mt-9" @click="handleError">
          {{ t('error.button') }}
        </button>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const localePath = useLocalePath()

const is404 = computed(() => props.error.statusCode === 404)

const handleError = () => clearError({ redirect: localePath('/vehicles') })

useSeoMeta({ title: () => (is404.value ? t('error.title') : t('error.genericTitle')) })
</script>
