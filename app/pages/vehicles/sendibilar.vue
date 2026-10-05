<template>
  <VehicleLandingPage :landing="landing" />
</template>

<script setup lang="ts">
import { vehicleLandingById } from '~/data/vehicleLandings'

// Keyword landing page. The file name is the Icelandic path; the English path
// is declared here so @nuxtjs/i18n emits hreflang/alternates for both.
// Static routes beat /vehicles/[slug], so no vehicle can shadow this page.
defineI18nRoute({
  paths: { en: '/vehicles/cargo-vans' },
})

const landing = vehicleLandingById('cargo-vans')!
</script>