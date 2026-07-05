<template>
  <div class="max-w-md mx-auto">
    <form class="space-y-5" @submit.prevent="submit">
      <div class="text-center">
        <p class="kicker">{{ $t('portal.reset.kicker') }}</p>
        <h1 class="mt-2 text-2xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.reset.title') }}</h1>
      </div>
      <div>
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.invite.password') }}</label>
        <input v-model="password" type="password" autocomplete="new-password" class="input-dark" required autofocus>
        <p class="mt-1.5 text-xs text-bone-400">{{ $t('portal.invite.passwordHint') }}</p>
      </div>
      <div>
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.invite.passwordRepeat') }}</label>
        <input v-model="passwordRepeat" type="password" autocomplete="new-password" class="input-dark" required>
      </div>
      <ul v-if="errors.length" class="text-sm text-signal-500 list-disc pl-5">
        <li v-for="err in errors" :key="err">{{ err }}</li>
      </ul>
      <button type="submit" class="btn-gold w-full disabled:opacity-60" :disabled="submitting || !password || !passwordRepeat">
        {{ submitting ? $t('portal.reset.submitting') : $t('portal.reset.submit') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal', portalPublic: true })

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()
const { check } = usePortalAuth()

const password = ref('')
const passwordRepeat = ref('')
const errors = ref<string[]>([])
const submitting = ref(false)

const submit = async () => {
  errors.value = []
  if (password.value !== passwordRepeat.value) {
    errors.value = [t('portal.invite.mismatch')]
    return
  }
  submitting.value = true
  try {
    await $fetch(`/api/portal/reset/${route.params.token}`, {
      method: 'POST',
      body: { password: password.value },
    })
    await check()
    router.replace(localePath('/portal'))
  }
  catch (e: any) {
    errors.value = e?.data?.data?.errors || [e?.data?.statusMessage || t('portal.login.failed')]
  }
  finally {
    submitting.value = false
  }
}

useHead({ title: 'Portal · Creative Filmmaking' })
</script>
