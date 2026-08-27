<template>
  <div class="text-center py-20 text-bone-400">{{ $t('portal.loading') }}</div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal' })

const { authed } = usePortalAuth()
const localePath = useLocalePath()
const router = useRouter()

// Everything is reached through the jobs now — land everyone on the job list.
watch(authed, (v) => {
  if (v) router.replace(localePath('/portal/jobs'))
}, { immediate: true })
</script>
