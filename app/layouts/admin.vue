<template>
  <div class="admin-ui min-h-screen bg-ink-950 text-bone-100">
    <!-- ============ Signed out: one centred card, no navigation ============ -->
    <div v-if="authed !== true" class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div class="mb-8 flex items-center gap-3">
        <img src="/logo-cf-rentals-dark.png" alt="CF Rentals · Creative Filmmaking" width="811" height="124" class="h-7 w-auto">
        <span class="admin-chip border-gold-500/50 text-gold-400">Admin</span>
      </div>

      <!-- Checking session -->
      <p v-if="authed === null" class="text-sm text-bone-400" role="status">Loading…</p>

      <!-- Not configured -->
      <div v-else-if="!configured" class="w-full max-w-md border border-signal-500/50 bg-signal-500/10 p-6 text-sm leading-relaxed">
        <p class="font-semibold text-signal-400">Admin panel is not configured</p>
        <p class="mt-2 text-bone-400">
          Set the <code class="text-bone-100">NUXT_ADMIN_PASSWORD</code> environment variable
          (in <code class="text-bone-100">.env</code> locally, or in the Railway service variables)
          and restart the server.
        </p>
      </div>

      <!-- Login -->
      <form v-else class="admin-card rail-top w-full max-w-sm p-6 sm:p-8 space-y-5" @submit.prevent="submit">
        <h1 class="font-heading text-xl font-semibold uppercase tracking-wide text-bone-100">Log in</h1>
        <div>
          <label for="admin-password" class="admin-label">Password</label>
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
          <label for="admin-code" class="admin-label">Authenticator code</label>
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
        <p v-if="error" class="text-sm text-signal-400" role="alert">{{ error }}</p>
        <button type="submit" class="btn-gold w-full" :disabled="pending || !password || (twoFactor && !code.trim())">
          {{ pending ? 'Logging in…' : 'Log in' }}
        </button>
      </form>

      <a href="/" class="admin-link mt-8">Back to the website</a>
    </div>

    <!-- ============ Signed in: sidebar + page ============ -->
    <template v-else>
      <a href="#admin-main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-gold-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950">
        Skip to content
      </a>

      <!-- Mobile top bar -->
      <div class="lg:hidden sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-ink-800 bg-ink-900 px-2" :inert="menuOpen">
        <button type="button" ref="menuButton" class="admin-icon-action" aria-label="Open menu" :aria-expanded="menuOpen" aria-controls="admin-sidebar" @click="menuOpen = true">
          <AdminIcon name="menu" :size="20" />
        </button>
        <NuxtLink to="/admin" class="flex items-center gap-2.5">
          <img src="/logo-cf-rentals-dark.png" alt="CF Rentals" width="811" height="124" class="h-5 w-auto">
          <span class="admin-chip border-gold-500/50 text-gold-400">Admin</span>
        </NuxtLink>
      </div>

      <!-- Drawer backdrop (mobile) -->
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="menuOpen" class="lg:hidden fixed inset-0 z-40 bg-ink-950/80" aria-hidden="true" @click="menuOpen = false" />
      </Transition>

      <!-- Sidebar -->
      <aside
        id="admin-sidebar"
        :role="menuOpen ? 'dialog' : undefined"
        :aria-modal="menuOpen ? 'true' : undefined"
        :aria-label="menuOpen ? 'Menu' : undefined"
        class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col lg:w-64 border-r border-ink-800 bg-ink-900 transition-[transform,visibility] duration-200 lg:visible lg:z-20 lg:translate-x-0"
        :class="menuOpen ? 'translate-x-0' : 'invisible -translate-x-full'"
        @keydown.esc="closeMenu"
        @keydown.tab="trapFocus"
      >
        <div class="flex h-14 lg:h-16 shrink-0 items-center justify-between gap-3 border-b border-ink-800 px-5">
          <NuxtLink to="/admin" class="flex items-center gap-2.5" aria-label="CF Rentals admin, overview">
            <img src="/logo-cf-rentals-dark.png" alt="" width="811" height="124" class="h-6 w-auto">
            <span class="admin-chip border-gold-500/50 text-gold-400">Admin</span>
          </NuxtLink>
          <button ref="closeButton" type="button" class="admin-icon-action lg:hidden -mr-3" aria-label="Close menu" @click="closeMenu">
            <AdminIcon name="close" />
          </button>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
          <div v-for="(group, gi) in groups" :key="group.title || gi" :class="gi ? 'mt-6' : ''">
            <p v-if="group.title" class="admin-eyebrow px-3 pb-2">{{ group.title }}</p>
            <ul class="space-y-0.5">
              <li v-for="item in group.items" :key="item.to">
                <NuxtLink
                  :to="item.to"
                  class="group relative flex min-h-[2.75rem] lg:min-h-[2.375rem] items-center gap-3 px-3 text-sm transition-colors"
                  :class="[
                    item.key === section ? 'bg-ink-800 text-bone-100 font-medium' : 'text-bone-400 hover:bg-ink-800/50 hover:text-bone-100',
                    item.child ? 'pl-[2.625rem]' : '',
                  ]"
                  :aria-current="item.key === section ? 'page' : undefined"
                >
                  <span v-if="item.key === section" class="absolute inset-y-0 left-0 w-0.5 bg-gold-500" aria-hidden="true" />
                  <AdminIcon v-if="!item.child" :name="item.icon" :class="item.key === section ? 'text-gold-400' : 'text-ink-400 group-hover:text-bone-400'" />
                  <span class="flex-1">{{ item.label }}</span>
                  <span
                    v-if="item.key === 'quotes' && newQuotes"
                    class="min-w-[1.25rem] bg-gold-500 px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none text-ink-950 tabular-nums"
                    :title="`${newQuotes} new quote ${newQuotes === 1 ? 'request' : 'requests'}`"
                  >
                    {{ newQuotes }}<span class="sr-only"> new</span>
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </nav>

        <div class="shrink-0 border-t border-ink-800 px-3 py-3 space-y-0.5">
          <a href="/" target="_blank" rel="noopener" class="group flex items-center gap-3 px-3 py-2 text-sm text-bone-400 transition-colors hover:bg-ink-800/50 hover:text-bone-100">
            <AdminIcon name="external" class="text-ink-400 group-hover:text-bone-400" />
            View website
          </a>
          <button type="button" class="group flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-bone-400 transition-colors hover:bg-ink-800/50 hover:text-bone-100" @click="signOut">
            <AdminIcon name="logout" class="text-ink-400 group-hover:text-bone-400" />
            Log out
          </button>
        </div>
      </aside>

      <main id="admin-main" class="lg:pl-64" tabindex="-1" :inert="menuOpen">
        <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <slot />
        </div>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AdminIconName } from '~/components/admin/Icon.vue'
import type { QuoteSummary } from '~/types'

const { authed, configured, twoFactor, check, login, logout } = useAdminAuth()
const route = useRoute()

interface NavItem { key: string, label: string, to: string, icon: AdminIconName, child?: boolean }

// The panel in three jobs: selling (the daily work), the catalogue the site
// shows, and who is allowed in. Categories belong to Equipment, so they nest under it.
const groups: { title: string, items: NavItem[] }[] = [
  { title: '', items: [
    { key: 'overview', label: 'Overview', to: '/admin', icon: 'overview' },
  ] },
  { title: 'Sales', items: [
    { key: 'quotes', label: 'Quotes', to: '/admin/quotes', icon: 'quotes' },
    { key: 'contracts', label: 'Contracts', to: '/admin/contracts', icon: 'contracts' },
    { key: 'rentals', label: 'Rental stats', to: '/admin/rentals', icon: 'rentals' },
  ] },
  { title: 'Catalogue', items: [
    { key: 'vehicles', label: 'Vehicles', to: '/admin/vehicles', icon: 'vehicles' },
    { key: 'equipment', label: 'Equipment', to: '/admin/equipment', icon: 'equipment' },
    { key: 'categories', label: 'Categories', to: '/admin/equipment/categories', icon: 'categories', child: true },
  ] },
  { title: 'Access', items: [
    { key: 'companies', label: 'Portal companies', to: '/admin/companies', icon: 'companies' },
    { key: 'security', label: 'Login security', to: '/admin/security', icon: 'security' },
  ] },
]

// Longest matching prefix wins, so /admin/equipment/categories is "categories", not "equipment".
const section = computed(() => {
  const path = route.path.replace(/\/$/, '')
  let best: NavItem | undefined
  for (const item of groups.flatMap(g => g.items)) {
    if (item.to === '/admin' ? path === '/admin' : path === item.to || path.startsWith(`${item.to}/`)) {
      if (!best || item.to.length > best.to.length) best = item
    }
  }
  return best?.key ?? 'overview'
})

// ---------- "New quotes" badge ----------
// Shared with the overview page, which refreshes it when it loads the quotes itself.
const newQuotes = useState<number>('admin-new-quotes', () => 0)
const refreshBadge = async () => {
  if (authed.value !== true) return
  try {
    const quotes = await $fetch<QuoteSummary[]>('/api/admin/quotes', { query: { t: Date.now() } })
    newQuotes.value = quotes.filter(q => q.status === 'new').length
  }
  catch { /* the badge is a nicety; pages report their own load errors */ }
}

// ---------- Mobile drawer ----------
// A modal dialog below lg: focus moves in, Tab stays inside, Esc closes and
// hands focus back to the menu button. The page behind is inert meanwhile.
const menuOpen = ref(false)
const menuButton = ref<HTMLButtonElement>()
const closeButton = ref<HTMLButtonElement>()
const closeMenu = () => {
  if (!menuOpen.value) return
  menuOpen.value = false
  nextTick(() => menuButton.value?.focus())
}
watch(menuOpen, open => open && nextTick(() => closeButton.value?.focus()))
const trapFocus = (e: KeyboardEvent) => {
  if (!menuOpen.value) return
  const items = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
  const first = items[0]
  const last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
}
watch(() => route.fullPath, () => {
  menuOpen.value = false
  refreshBadge()
})
watch(authed, v => v === true && refreshBadge())

// ---------- Login ----------
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
