<template>
  <div class="min-h-screen bg-ink-950 text-bone-100">
    <header class="border-b border-ink-800 bg-ink-900">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <NuxtLink to="/admin" class="font-heading font-semibold uppercase tracking-wider text-bone-100">
          Creative Filmmaking <span class="text-gold-500">· Admin</span>
        </NuxtLink>
        <nav v-if="authed" class="flex items-center gap-5 text-xs uppercase tracking-widest sm:ml-4 sm:mr-auto">
          <NuxtLink to="/admin" class="transition-colors hover:text-gold-400" :class="section === 'vehicles' ? 'text-gold-400' : 'text-bone-400'">
            Vehicles
          </NuxtLink>
          <NuxtLink to="/admin/equipment" class="transition-colors hover:text-gold-400" :class="section === 'equipment' ? 'text-gold-400' : 'text-bone-400'">
            Equipment
          </NuxtLink>
          <NuxtLink to="/admin/quotes" class="transition-colors hover:text-gold-400" :class="section === 'quotes' ? 'text-gold-400' : 'text-bone-400'">
            Quotes
          </NuxtLink>
          <NuxtLink to="/admin/rentals" class="transition-colors hover:text-gold-400" :class="section === 'rentals' ? 'text-gold-400' : 'text-bone-400'">
            Rentals
          </NuxtLink>
          <NuxtLink to="/admin/contracts" class="transition-colors hover:text-gold-400" :class="section === 'contracts' ? 'text-gold-400' : 'text-bone-400'">
            Contracts
          </NuxtLink>
          <NuxtLink to="/admin/companies" class="transition-colors hover:text-gold-400" :class="section === 'companies' ? 'text-gold-400' : 'text-bone-400'">
            Companies
          </NuxtLink>
        </nav>
        <div class="flex items-center gap-5 text-sm">
          <a href="/" target="_blank" class="whitespace-nowrap text-bone-400 hover:text-gold-400 transition-colors">View site ↗</a>
          <NuxtLink
            v-if="authed"
            to="/admin/security"
            class="transition-colors hover:text-gold-400 uppercase text-xs tracking-widest"
            :class="route.path.includes('/admin/security') ? 'text-gold-400' : 'text-bone-400'"
          >
            Security
          </NuxtLink>
          <button
            v-if="authed"
            type="button"
            class="whitespace-nowrap text-bone-400 hover:text-gold-400 transition-colors uppercase text-xs tracking-widest"
            @click="signOut"
          >
            Log out
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <!-- Checking session -->
      <div v-if="authed === null" class="text-center py-20 text-bone-400">Loading…</div>

      <!-- Not configured -->
      <div v-else-if="!configured" class="max-w-lg mx-auto border border-signal-500/50 bg-signal-500/10 p-6 text-sm leading-relaxed">
        <p class="font-semibold text-signal-500">Admin panel is not configured</p>
        <p class="mt-2 text-bone-400">
          Set the <code class="text-bone-100">NUXT_ADMIN_PASSWORD</code> environment variable
          (in <code class="text-bone-100">.env</code> locally, or in the Railway service variables)
          and restart the server.
        </p>
      </div>

      <!-- Login -->
      <form v-else-if="!authed" class="max-w-sm mx-auto mt-10 space-y-5" @submit.prevent="submit">
        <h1 class="text-2xl font-semibold uppercase tracking-wide text-bone-100 text-center">Admin login</h1>
        <div>
          <label for="admin-password" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Password</label>
          <input
            id="admin-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="input-dark"
            autofocus
          >
        </div>
        <div v-if="twoFactor">
          <label for="admin-code" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Authenticator code</label>
          <input
            id="admin-code"
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            autocapitalize="off"
            spellcheck="false"
            placeholder="123 456"
            class="input-dark tracking-widest"
          >
          <p class="mt-1.5 text-xs text-bone-400">
            The 6-digit code from your authenticator app. Lost the phone? Enter a recovery code instead.
          </p>
        </div>
        <p v-if="error" class="text-sm text-signal-500">{{ error }}</p>
        <button type="submit" class="btn-gold w-full disabled:opacity-60" :disabled="pending || !password || (twoFactor && !code.trim())">
          {{ pending ? 'Logging in…' : 'Log in' }}
        </button>
      </form>

      <!-- Authenticated: render the admin page -->
      <slot v-else />
    </main>
  </div>
</template>

<script setup lang="ts">
const { authed, configured, twoFactor, check, login, logout } = useAdminAuth()

const route = useRoute()
const section = computed(() =>
  route.path.includes('/admin/equipment')
    ? 'equipment'
    : route.path.includes('/admin/quotes')
      ? 'quotes'
      : route.path.includes('/admin/rentals')
        ? 'rentals'
        : route.path.includes('/admin/contracts')
          ? 'contracts'
          : route.path.includes('/admin/companies')
            ? 'companies'
            : route.path.includes('/admin/security') ? 'security' : 'vehicles')

const password = ref('')
const code = ref('')
const error = ref('')
const pending = ref(false)

onMounted(check)

const submit = async () => {
  error.value = ''
  pending.value = true
  try {
    await login(password.value, twoFactor.value ? code.value : '')
    password.value = ''
    code.value = ''
  }
  catch (e: any) {
    error.value = e?.data?.statusMessage || 'Login failed. Please try again.'
    // A code works once and expires in seconds: never resubmit the old one.
    code.value = ''
    // Two-factor may have been switched on since this form loaded.
    check()
  }
  finally {
    pending.value = false
  }
}

const signOut = () => logout().catch(() => {})
</script>
