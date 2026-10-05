<template>
  <header class="fixed top-0 inset-x-0 z-50 bg-ink-950/85 backdrop-blur border-b border-ink-800">
    <div class="wrap">
      <div class="flex items-center justify-between h-16 xl:h-20">
        <!-- Wordmark -->
        <NuxtLink :to="localePath('/')" class="flex shrink-0 items-center gap-3" @click="mobileOpen = false">
          <img src="/logo.svg" alt="" class="w-8 h-8" width="32" height="32">
          <span class="font-heading font-semibold uppercase tracking-widest text-bone-100 text-lg leading-none">
            Creative<span class="text-gold-500">&nbsp;Filmmaking</span>
          </span>
        </NuxtLink>

        <!-- Desktop nav -->
        <nav class="hidden xl:flex items-center gap-5" :aria-label="t('footer.navTitle')">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="localePath(item.to)"
            class="whitespace-nowrap text-sm uppercase tracking-wider font-medium text-bone-400 hover:text-bone-100 transition-colors"
            active-class="!text-gold-400"
          >
            {{ t(item.label) }}
          </NuxtLink>
          <NuxtLink :to="localePath('/contact')" class="btn-gold btn-sm whitespace-nowrap">
            {{ t('nav.cta') }}
          </NuxtLink>
          <CartLink />
          <LanguageSwitcher />
          <!-- Crew portal login: a private, noindexed app. Labelled as such and
               nofollowed so neither visitors nor crawlers read it as "Services". -->
          <NuxtLink :to="localePath('/portal')" rel="nofollow" class="btn-outline btn-sm whitespace-nowrap">
            {{ t('nav.crewLogin') }}
          </NuxtLink>
        </nav>

        <!-- Mobile controls -->
        <div class="flex xl:hidden items-center gap-1">
          <CartLink @click="mobileOpen = false" />
          <LanguageSwitcher />
          <button
            type="button"
            class="p-2 text-bone-100"
            :aria-expanded="mobileOpen"
            aria-controls="mobile-nav"
            :aria-label="t('nav.menu')"
            @click="mobileOpen = !mobileOpen"
          >
            <svg v-if="!mobileOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <nav v-if="mobileOpen" id="mobile-nav" class="xl:hidden border-t border-ink-800 bg-ink-950 px-4 py-4 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="localePath(item.to)"
          class="block px-3 py-3 text-sm uppercase tracking-wider font-medium text-bone-400 hover:text-bone-100 hover:bg-ink-900 transition-colors"
          active-class="!text-gold-400"
          @click="mobileOpen = false"
        >
          {{ t(item.label) }}
        </NuxtLink>
        <NuxtLink :to="localePath('/contact')" class="btn-gold w-full mt-2" @click="mobileOpen = false">
          {{ t('nav.cta') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/portal')" rel="nofollow" class="btn-outline w-full mt-2" @click="mobileOpen = false">
          {{ t('nav.crewLogin') }}
        </NuxtLink>
      </nav>
    </Transition>
  </header>

  <!-- Spacer so content clears the fixed header -->
  <div class="h-16 xl:h-20" aria-hidden="true" />
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const navItems = [
  { to: '/', label: 'nav.home' },
  { to: '/vehicles', label: 'nav.fleet' },
  { to: '/equipment', label: 'nav.equipment' },
  { to: '/about', label: 'nav.about' },
  { to: '/contact', label: 'nav.contact' },
]

const mobileOpen = ref(false)

// Escape closes the mobile menu
const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && mobileOpen.value) mobileOpen.value = false
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>
