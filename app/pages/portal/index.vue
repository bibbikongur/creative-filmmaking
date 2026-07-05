<template>
  <div class="text-center py-20 text-bone-400">{{ $t('portal.loading') }}</div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal' })

const { authed, isCompanyAdmin, hasJobs } = usePortalAuth()
const localePath = useLocalePath()
const router = useRouter()

// Land users on the page that matches what they can do.
watch(authed, (v) => {
  if (!v) return
  if (hasJobs.value) router.replace(localePath('/portal/timesheet'))
  else if (isCompanyAdmin.value) router.replace(localePath('/portal/dashboard'))
}, { immediate: true })
</script>
