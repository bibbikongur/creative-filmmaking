<template>
  <header class="fixed top-0 inset-x-0 z-50 bg-ink-950/85 backdrop-blur border-b border-ink-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 lg:h-20">
        <!-- Wordmark -->
        <NuxtLink :to="localePath('/')" class="flex items-center gap-3 group" @click="mobileOpen = false">
          <img src="/logo.svg" alt="" class="w-8 h-8" >
          <span class="font-heading font-semibold uppercase tracking-widest text-bone-100 text-lg leading-none">
            Creative<span class="text-gold-500">&nbsp;Filmmaking</span>
          </span>
        </NuxtLink>

        <!-- Desktop nav -->
        <nav class="hidden md:flex items-center gap-8">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="localePath(item.to)"
            class="text-sm uppercase tracking-wider font-medium text-bone-400 hover:text-bone-100 transition-colors"
            active-class="!text-gold-400"
          >
            {{ t(item.label) }}
          </NuxtLink>
          <NuxtLink :to="localePath('/contact')" class="btn-gold !px-5 !py-2.5">
            {{ t('common.requestOffer') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/cart')" class="relative p-2 text-bone-400 hover:text-bone-100 transition-colors" :aria-label="t('cart.title')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span
              v-if="cart.count.value"
              class="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center bg-gold-500 text-ink-950 text-[10px] font-bold rounded-full"
            >
              {{ cart.count.value }}
            </span>
          </NuxtLink>
          <LanguageSwitcher />
        </nav>

        <!-- Mobile controls -->
        <div class="flex md:hidden items-center gap-2">
          <NuxtLink :to="localePath('/cart')" class="relative p-2 text-bone-100" :aria-label="t('cart.title')" @click="mobileOpen = false">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span
              v-if="cart.count.value"
              class="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center bg-gold-500 text-ink-950 text-[10px] font-bold rounded-full"
            >
              {{ cart.count.value }}
            </span>
          </NuxtLink>
          <LanguageSwitcher />
          <button
            type="button"
            class="p-2 text-bone-100"
            :aria-expanded="mobileOpen"
            aria-label="Menu"
            @click="mobileOpen = !mobileOpen"
          >
            <svg v-if="!mobileOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <nav v-if="mobileOpen" class="md:hidden border-t border-ink-800 bg-ink-950 px-4 py-4 space-y-1">
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
          {{ t('common.requestOffer') }}
        </NuxtLink>
      </nav>
    </Transition>
  </header>

  <!-- Spacer so content clears the fixed header -->
  <div class="h-16 lg:h-20" aria-hidden="true" />
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const cart = useCart()

const navItems = [
  { to: '/', label: 'nav.home' },
  { to: '/vehicles', label: 'nav.fleet' },
  { to: '/equipment', label: 'nav.equipment' },
  { to: '/about', label: 'nav.about' },
  { to: '/contact', label: 'nav.contact' },
]

const mobileOpen = ref(false)
</script>
