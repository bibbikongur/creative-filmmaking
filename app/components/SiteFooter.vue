<template>
  <footer class="bg-ink-900 border-t border-ink-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div class="grid gap-10 md:grid-cols-3">
        <!-- Brand -->
        <div>
          <NuxtLink :to="localePath('/')" class="flex items-center gap-3">
            <img src="/logo.svg" alt="" class="w-8 h-8" >
            <span class="font-heading font-semibold uppercase tracking-widest text-bone-100">
              Creative<span class="text-gold-500">&nbsp;Filmmaking</span>
            </span>
          </NuxtLink>
          <p class="mt-4 text-sm text-bone-400 leading-relaxed max-w-xs">
            {{ t('footer.tagline') }}
          </p>
        </div>

        <!-- Site nav -->
        <div>
          <h3 class="kicker mb-4">{{ t('footer.navTitle') }}</h3>
          <ul class="space-y-2.5">
            <li v-for="item in navItems" :key="item.to">
              <NuxtLink
                :to="localePath(item.to)"
                class="text-sm text-bone-400 hover:text-gold-400 transition-colors"
              >
                {{ t(item.label) }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h3 class="kicker mb-4">{{ t('footer.contactTitle') }}</h3>
          <ul class="space-y-2.5 text-sm text-bone-400">
            <li>
              <a :href="`mailto:${contact.email}`" class="hover:text-gold-400 transition-colors">
                {{ contact.email }}
              </a>
            </li>
            <li>
              <a :href="`tel:${contact.phone.replace(/\s/g, '')}`" class="hover:text-gold-400 transition-colors">
                {{ contact.phone }}
              </a>
            </li>
            <li>{{ contact.address }}</li>
          </ul>
        </div>
      </div>

      <div class="mt-12 pt-6 border-t border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-500">
        <p>© {{ year }} Creative Filmmaking. {{ t('footer.rights') }}</p>
        <p class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-signal-500 animate-pulse" aria-hidden="true" />
          {{ t('hero.availability') }}
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const contact = useRuntimeConfig().public.contact

const navItems = [
  { to: '/', label: 'nav.home' },
  { to: '/vehicles', label: 'nav.fleet' },
  { to: '/about', label: 'nav.about' },
  { to: '/contact', label: 'nav.contact' },
]

const year = new Date().getFullYear()
</script>
