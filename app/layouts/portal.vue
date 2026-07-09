<template>
  <div class="min-h-screen bg-ink-950 text-bone-100">
    <header class="border-b border-ink-800 bg-ink-900">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <NuxtLink :to="localePath('/portal')" class="font-heading font-semibold uppercase tracking-wider text-bone-100">
          Creative Filmmaking <span class="text-gold-500">· {{ $t('portal.title') }}</span>
        </NuxtLink>
        <nav v-if="authed" class="flex flex-wrap items-center gap-5 text-xs uppercase tracking-widest sm:ml-4 sm:mr-auto">
          <template v-if="hasJobs">
            <NuxtLink :to="localePath('/portal/timesheet')" class="transition-colors hover:text-gold-400" :class="section === 'timesheet' ? 'text-gold-400' : 'text-bone-400'">
              {{ $t('portal.nav.timesheet') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/portal/history')" class="transition-colors hover:text-gold-400" :class="section === 'history' ? 'text-gold-400' : 'text-bone-400'">
              {{ $t('portal.nav.history') }}
            </NuxtLink>
          </template>
          <NuxtLink v-if="canReview" :to="localePath('/portal/timesheets')" class="transition-colors hover:text-gold-400" :class="section === 'review' ? 'text-gold-400' : 'text-bone-400'">
            {{ $t('portal.nav.review') }}
          </NuxtLink>
          <NuxtLink v-if="isCompanyAdmin" :to="localePath('/portal/jobs')" class="transition-colors hover:text-gold-400" :class="section === 'jobs' ? 'text-gold-400' : 'text-bone-400'">
            {{ $t('portal.nav.jobs') }}
          </NuxtLink>
          <NuxtLink v-if="canReview" :to="localePath('/portal/dashboard')" class="transition-colors hover:text-gold-400" :class="section === 'dashboard' ? 'text-gold-400' : 'text-bone-400'">
            {{ $t('portal.nav.dashboard') }}
          </NuxtLink>
        </nav>
        <div class="flex items-center gap-5 text-sm">
          <NuxtLink :to="switchLocalePath(otherLocale)" class="text-bone-400 hover:text-gold-400 transition-colors text-xs uppercase tracking-widest">
            {{ otherLocale === 'is' ? 'Íslenska' : 'English' }}
          </NuxtLink>
          <button
            v-if="authed"
            type="button"
            class="text-bone-400 hover:text-gold-400 transition-colors uppercase text-xs tracking-widest"
            @click="signOut"
          >
            {{ $t('portal.nav.logout') }}
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <!-- Public pages (invite / reset) render without the auth gate -->
      <slot v-if="isPublicPage" />

      <!-- Checking session -->
      <div v-else-if="authed === null" class="text-center py-20 text-bone-400">{{ $t('portal.loading') }}</div>

      <!-- Not configured -->
      <div v-else-if="!configured" class="max-w-lg mx-auto border border-signal-500/50 bg-signal-500/10 p-6 text-sm leading-relaxed">
        <p class="font-semibold text-signal-500">{{ $t('portal.notConfigured') }}</p>
        <p class="mt-2 text-bone-400">
          Set the <code class="text-bone-100">NUXT_SESSION_SECRET</code> and
          <code class="text-bone-100">NUXT_ENCRYPTION_KEY</code> environment variables and restart the server.
        </p>
      </div>

      <!-- Login -->
      <form v-else-if="!authed" class="max-w-sm mx-auto mt-10 space-y-5" @submit.prevent="submit">
        <h1 class="text-2xl font-semibold uppercase tracking-wide text-bone-100 text-center">{{ $t('portal.login.title') }}</h1>
        <div>
          <label for="portal-email" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.login.email') }}</label>
          <input id="portal-email" v-model="email" type="email" autocomplete="email" class="input-dark" autofocus>
        </div>
        <div>
          <label for="portal-password" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.login.password') }}</label>
          <input id="portal-password" v-model="password" type="password" autocomplete="current-password" class="input-dark">
        </div>
        <p v-if="error" class="text-sm text-signal-500">{{ error }}</p>
        <p v-if="forgotSent" class="text-sm text-gold-400">{{ $t('portal.login.forgotSent') }}</p>
        <button type="submit" class="btn-gold w-full disabled:opacity-60" :disabled="pending || !email || !password">
          {{ pending ? $t('portal.login.loggingIn') : $t('portal.login.submit') }}
        </button>
        <button
          type="button"
          class="block mx-auto text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors disabled:opacity-50"
          :disabled="forgotPending || !email"
          @click="forgot"
        >
          {{ $t('portal.login.forgot') }}
        </button>
      </form>

      <!-- Authenticated: render the portal page -->
      <slot v-else />
    </main>
  </div>
</template>

<script setup lang="ts">
const { authed, configured, isCompanyAdmin, canReview, hasJobs, check, login, logout } = usePortalAuth()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { locale } = useI18n()

const otherLocale = computed(() => (locale.value === 'is' ? 'en' : 'is'))

const route = useRoute()
const isPublicPage = computed(() => Boolean(route.meta.portalPublic))
const section = computed(() => {
  const p = route.path
  if (p.includes('/portal/history')) return 'history'
  if (p.includes('/portal/timesheets')) return 'review'
  if (p.includes('/portal/jobs')) return 'jobs'
  if (p.includes('/portal/dashboard')) return 'dashboard'
  return 'timesheet'
})

const email = ref('')
const password = ref('')
const error = ref('')
const pending = ref(false)
const forgotPending = ref(false)
const forgotSent = ref(false)

onMounted(check)

const { t } = useI18n()

const submit = async () => {
  error.value = ''
  forgotSent.value = false
  pending.value = true
  try {
    await login(email.value, password.value)
    password.value = ''
  }
  catch (e: any) {
    error.value = e?.data?.statusMessage || t('portal.login.failed')
  }
  finally {
    pending.value = false
  }
}

const forgot = async () => {
  error.value = ''
  forgotPending.value = true
  try {
    await $fetch('/api/portal/forgot', { method: 'POST', body: { email: email.value } })
    forgotSent.value = true
  }
  catch (e: any) {
    error.value = e?.data?.statusMessage || t('portal.login.failed')
  }
  finally {
    forgotPending.value = false
  }
}

const signOut = () => logout().catch(() => {})
</script>
