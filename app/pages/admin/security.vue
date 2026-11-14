<template>
  <div class="max-w-2xl">
    <p class="kicker">Security</p>
    <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">Two-factor login</h1>
    <p class="mt-3 text-sm leading-relaxed text-bone-400">
      With two-factor on, logging in to the admin panel takes the password and a 6-digit code from an
      authenticator app on your phone (Google Authenticator, Microsoft Authenticator, 1Password, Authy).
      A leaked or guessed password is then not enough on its own.
    </p>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!status" class="mt-8 text-sm text-bone-400">Loading…</p>

    <!-- Recovery codes: shown once, right after switching on -->
    <section v-else-if="recoveryCodes" class="mt-8 border border-gold-500/50 bg-gold-500/5 p-6">
      <h2 class="text-lg font-semibold uppercase tracking-wide text-gold-400">Two-factor is on. Save these recovery codes</h2>
      <p class="mt-2 text-sm leading-relaxed text-bone-400">
        Each code logs you in once if you lose your phone. They are shown only this one time:
        keep them in a password manager or print them. Other browsers have been logged out.
      </p>
      <ul class="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-base text-bone-100">
        <li v-for="c in recoveryCodes" :key="c">{{ c }}</li>
      </ul>
      <div class="mt-6 flex flex-wrap gap-3">
        <button type="button" class="btn-outline !px-4 !py-2 !text-xs" @click="copyCodes">{{ copied ? 'Copied' : 'Copy' }}</button>
        <button type="button" class="btn-outline !px-4 !py-2 !text-xs" @click="downloadCodes">Download .txt</button>
        <button type="button" class="btn-gold !px-4 !py-2 !text-xs" @click="recoveryCodes = null">I have saved them</button>
      </div>
    </section>

    <!-- On -->
    <section v-else-if="status.enabled" class="mt-8 space-y-8">
      <div class="border border-ink-800 bg-ink-900/70 p-6">
        <p class="text-sm font-semibold uppercase tracking-widest text-gold-400">Two-factor is on</p>
        <dl class="mt-4 space-y-2 text-sm">
          <div v-if="status.enabledAt" class="flex justify-between gap-4">
            <dt class="text-bone-400">Switched on</dt>
            <dd class="text-bone-100">{{ new Date(status.enabledAt).toLocaleString() }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-bone-400">Recovery codes left</dt>
            <dd :class="status.recoveryCodesLeft <= 2 ? 'text-signal-500' : 'text-bone-100'">{{ status.recoveryCodesLeft }}</dd>
          </div>
        </dl>
        <p v-if="status.recoveryCodesLeft <= 2" class="mt-4 text-sm text-bone-400">
          You are almost out of recovery codes. Turn two-factor off and on again to get a new set.
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="disable">
        <h2 class="text-lg font-semibold uppercase tracking-wide text-bone-100">Turn off, or move to a new phone</h2>
        <p class="text-sm leading-relaxed text-bone-400">
          Turning it off needs the password and a current code (or a recovery code).
          To move to a new phone, turn it off and set it up again.
        </p>
        <div>
          <label for="tf-off-password" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Password</label>
          <input id="tf-off-password" v-model="password" type="password" autocomplete="current-password" class="input-dark">
        </div>
        <div>
          <label for="tf-off-code" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Authenticator or recovery code</label>
          <input id="tf-off-code" v-model="code" type="text" autocomplete="one-time-code" autocapitalize="off" spellcheck="false" class="input-dark tracking-widest">
        </div>
        <p v-if="error" class="text-sm text-signal-500">{{ error }}</p>
        <button type="submit" class="btn-outline disabled:opacity-60" :disabled="pending || !password || !code.trim()">
          {{ pending ? 'Turning off…' : 'Turn off two-factor' }}
        </button>
      </form>
    </section>

    <!-- Off, setup in progress -->
    <section v-else-if="setup" class="mt-8 space-y-6">
      <div>
        <h2 class="text-lg font-semibold uppercase tracking-wide text-bone-100">1. Scan this with your authenticator app</h2>
        <div class="mt-4 inline-block bg-white p-3">
          <img :src="qrSrc" alt="QR code for the authenticator app" width="220" height="220" class="block">
        </div>
        <p class="mt-4 text-sm text-bone-400">Cannot scan it? Enter this key in the app by hand (time-based, 6 digits):</p>
        <p class="mt-1 font-mono text-sm break-all text-bone-100 select-all">{{ groupedSecret }}</p>
      </div>

      <form class="space-y-4" @submit.prevent="enable">
        <h2 class="text-lg font-semibold uppercase tracking-wide text-bone-100">2. Enter the code the app shows</h2>
        <input
          v-model="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          placeholder="123 456"
          aria-label="6-digit code"
          class="input-dark tracking-widest max-w-[12rem]"
        >
        <p v-if="error" class="text-sm text-signal-500">{{ error }}</p>
        <div class="flex flex-wrap gap-3">
          <button type="submit" class="btn-gold disabled:opacity-60" :disabled="pending || code.replace(/\s/g, '').length !== 6">
            {{ pending ? 'Checking…' : 'Turn on two-factor' }}
          </button>
          <button type="button" class="btn-outline" @click="cancelSetup">Cancel</button>
        </div>
      </form>
    </section>

    <!-- Off -->
    <section v-else class="mt-8">
      <div v-if="status.resetRequested" class="border border-signal-500/50 bg-signal-500/10 p-6 text-sm leading-relaxed">
        <p class="font-semibold text-signal-500">Two-factor reset is active</p>
        <p class="mt-2 text-bone-400">
          The <code class="text-bone-100">NUXT_ADMIN_TWO_FACTOR_RESET</code> variable is set on the server, so
          two-factor is off and cannot be switched on. Remove the variable and restart, then come back here.
        </p>
      </div>
      <form v-else class="space-y-4" @submit.prevent="startSetup">
        <p class="text-sm font-semibold uppercase tracking-widest text-signal-500">Two-factor is off</p>
        <div>
          <label for="tf-on-password" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Confirm your password to begin</label>
          <input id="tf-on-password" v-model="password" type="password" autocomplete="current-password" class="input-dark max-w-sm">
        </div>
        <p v-if="error" class="text-sm text-signal-500">{{ error }}</p>
        <button type="submit" class="btn-gold disabled:opacity-60" :disabled="pending || !password">
          {{ pending ? 'Starting…' : 'Set up two-factor' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface Status { enabled: boolean, enabledAt: string | null, recoveryCodesLeft: number, resetRequested: boolean }
interface Setup { secret: string, uri: string, qrSvg: string }

const { twoFactor } = useAdminAuth()

const status = ref<Status | null>(null)
const loadError = ref('')
const setup = ref<Setup | null>(null)
const recoveryCodes = ref<string[] | null>(null)
const password = ref('')
const code = ref('')
const error = ref('')
const pending = ref(false)
const copied = ref(false)

const load = async () => {
  try {
    status.value = await $fetch<Status>('/api/admin/two-factor')
    twoFactor.value = status.value.enabled
  }
  catch (e: any) {
    loadError.value = e?.data?.statusMessage || 'Could not load the two-factor status.'
  }
}
onMounted(load)

// The QR is an SVG the server drew; shown through <img> so none of it is
// ever parsed as page markup.
const qrSrc = computed(() => setup.value ? `data:image/svg+xml;utf8,${encodeURIComponent(setup.value.qrSvg)}` : '')
const groupedSecret = computed(() => setup.value?.secret.replace(/(.{4})/g, '$1 ').trim() ?? '')

const run = async (fn: () => Promise<void>) => {
  error.value = ''
  pending.value = true
  try {
    await fn()
  }
  catch (e: any) {
    error.value = e?.data?.statusMessage || 'Something went wrong. Please try again.'
  }
  finally {
    pending.value = false
  }
}

const startSetup = () => run(async () => {
  setup.value = await $fetch<Setup>('/api/admin/two-factor/setup', { method: 'POST', body: { password: password.value } })
  password.value = ''
  code.value = ''
})

const cancelSetup = () => {
  setup.value = null
  code.value = ''
  error.value = ''
}

const enable = () => run(async () => {
  const res = await $fetch<{ recoveryCodes: string[] }>('/api/admin/two-factor/enable', { method: 'POST', body: { code: code.value } })
  recoveryCodes.value = res.recoveryCodes
  setup.value = null
  code.value = ''
  await load()
})

const disable = () => run(async () => {
  try {
    await $fetch('/api/admin/two-factor/disable', { method: 'POST', body: { password: password.value, code: code.value } })
  }
  finally {
    code.value = ''
  }
  password.value = ''
  await load()
})

const codesText = () =>
  `Creative Filmmaking admin: two-factor recovery codes\nEach code works once.\n\n${(recoveryCodes.value ?? []).join('\n')}\n`

const copyCodes = async () => {
  try {
    await navigator.clipboard.writeText(codesText())
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
  catch { /* clipboard blocked: the codes are on screen to copy by hand */ }
}

const downloadCodes = () => {
  const url = URL.createObjectURL(new Blob([codesText()], { type: 'text/plain' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'creative-filmmaking-admin-recovery-codes.txt'
  a.click()
  URL.revokeObjectURL(url)
}

useHead({ title: 'Security · Admin · Creative Filmmaking' })
</script>
