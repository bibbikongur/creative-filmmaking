<template>
  <EquipmentLandingPage :landing="landing" />
</template>

<script setup lang="ts">
import { equipmentLandingFor } from '~/data/equipmentLandings'

// Keyword landing page. The file name is the Icelandic path; the English path
// is declared here so @nuxtjs/i18n emits hreflang/alternates for both.
// Static routes beat /equipment/[slug], so no item can shadow this page.
defineI18nRoute({
  paths: { en: '/equipment/safety-and-traffic' },
})

const landing = equipmentLandingFor('safety')
</script>