<template>
  <div class="max-w-md mx-auto">
    <p v-if="pendingLoad" class="text-center py-20 text-bone-400">{{ $t('portal.loading') }}</p>

    <div v-else-if="invalid" class="border border-signal-500/50 bg-signal-500/10 p-6 text-sm leading-relaxed">
      <p class="font-semibold text-signal-500">{{ $t('portal.invite.invalidTitle') }}</p>
      <p class="mt-2 text-bone-400">{{ $t('portal.invite.invalidBody') }}</p>
    </div>

    <form v-else class="space-y-5" @submit.prevent="submit">
      <div class="text-center">
        <p class="kicker">{{ $t('portal.invite.kicker') }}</p>
        <h1 class="mt-2 text-2xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.invite.title') }}</h1>
        <p class="mt-3 text-sm text-bone-400">
          {{ $t('portal.invite.for') }} <span class="text-bone-100">{{ invite?.email }}</span>
        </p>
        <p v-if="context" class="mt-1 text-sm text-bone-400">{{ context }}</p>
      </div>
      <div>
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.invite.name') }}</label>
        <input v-model="name" type="text" autocomplete="name" class="input-dark">
      </div>
      <div>
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.invite.password') }}</label>
        <input v-model="password" type="password" autocomplete="new-password" class="input-dark" required>
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
        {{ submitting ? $t('portal.invite.submitting') : $t('portal.invite.submit') }}
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

const token = computed(() => String(route.params.token ?? ''))

interface InviteInfo {
  email: string
  name?: string
  companies: string[]
  jobs: { jobName: string, companyName: string }[]
}

const invite = ref<InviteInfo | null>(null)
const pendingLoad = ref(true)
const invalid = ref(false)

const name = ref('')
const password = ref('')
const passwordRepeat = ref('')
const errors = ref<string[]>([])
const submitting = ref(false)

const context = computed(() => {
  if (!invite.value) return ''
  const parts: string[] = []
  if (invite.value.companies.length) {
    parts.push(`${t('portal.invite.adminOf')} ${invite.value.companies.join(', ')}`)
  }
  if (invite.value.jobs.length) {
    parts.push(invite.value.jobs.map(j => `${j.jobName} (${j.companyName})`).join(', '))
  }
  return parts.join(' · ')
})

onMounted(async () => {
  try {
    invite.value = await $fetch<InviteInfo>(`/api/portal/invite/${token.value}`)
    name.value = invite.value.name ?? ''
  }
  catch {
    invalid.value = true
  }
  finally {
    pendingLoad.value = false
  }
})

const submit = async () => {
  errors.value = []
  if (password.value !== passwordRepeat.value) {
    errors.value = [t('portal.invite.mismatch')]
    return
  }
  submitting.value = true
  try {
    await $fetch(`/api/portal/invite/${token.value}/accept`, {
      method: 'POST',
      body: { password: password.value, name: name.value },
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
