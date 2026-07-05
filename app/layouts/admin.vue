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
          <NuxtLink to="/admin/companies" class="transition-colors hover:text-gold-400" :class="section === 'companies' ? 'text-gold-400' : 'text-bone-400'">
            Companies
          </NuxtLink>
        </nav>
        <div class="flex items-center gap-5 text-sm">
          <a href="/" target="_blank" class="text-bone-400 hover:text-gold-400 transition-colors">View site ↗</a>
          <button
            v-if="authed"
            type="button"
            class="text-bone-400 hover:text-gold-400 transition-colors uppercase text-xs tracking-widest"
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
        <p v-if="error" class="text-sm text-signal-500">{{ error }}</p>
        <button type="submit" class="btn-gold w-full disabled:opacity-60" :disabled="pending || !password">
          {{ pending ? 'Logging in…' : 'Log in' }}
        </button>
      </form>

      <!-- Authenticated: render the admin page -->
      <slot v-else />
    </main>
  </div>
</template>

<script setup lang="ts">
const { authed, configured, check, login, logout } = useAdminAuth()

const route = useRoute()
const section = computed(() =>
  route.path.includes('/admin/equipment')
    ? 'equipment'
    : route.path.includes('/admin/quotes')
      ? 'quotes'
      : route.path.includes('/admin/companies') ? 'companies' : 'vehicles')

const password = ref('')
const error = ref('')
const pending = ref(false)

onMounted(check)

const submit = async () => {
  error.value = ''
  pending.value = true
  try {
    await login(password.value)
    password.value = ''
  }
  catch (e: any) {
    error.value = e?.data?.statusMessage || 'Login failed. Please try again.'
  }
  finally {
    pending.value = false
  }
}

const signOut = () => logout().catch(() => {})
</script>
