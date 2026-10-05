<template>
  <footer class="bg-ink-900 border-t border-ink-800">
    <div class="wrap py-14">
      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Brand -->
        <div>
          <NuxtLink :to="localePath('/')" class="flex items-center gap-3">
            <img src="/logo.svg" alt="" class="w-8 h-8" width="32" height="32">
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

        <!-- Popular rentals — keyword-rich internal links on every page -->
        <div>
          <h3 class="kicker mb-4">{{ t('footer.rentalsTitle') }}</h3>
          <ul class="space-y-2.5">
            <li v-for="link in rentalLinks" :key="link.label">
              <NuxtLink
                :to="localePath({ name: link.routeName })"
                class="text-sm text-bone-400 hover:text-gold-400 transition-colors"
              >
                {{ t(link.label) }}
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

      <div class="mt-12 pt-6 border-t border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-400">
        <p>© {{ year }} Creative Filmmaking. {{ t('footer.rights') }}</p>
        <p class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-signal-500 motion-safe:animate-pulse" aria-hidden="true" />
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
  { to: '/equipment', label: 'nav.equipment' },
  { to: '/about', label: 'nav.about' },
  { to: '/contact', label: 'nav.contact' },
]

// Descriptive "X til leigu" anchors to the keyword landing pages, from every
// page. The landings link on to the individual vehicles and items.
const rentalLinks = [
  { routeName: 'vehicles-kassabilar', label: 'footer.rentals.boxTrucks' },
  { routeName: 'vehicles-sendibilar', label: 'footer.rentals.van' },
  { routeName: 'vehicles-hjolhysi', label: 'footer.rentals.caravans' },
  { routeName: 'vehicles-kerrur', label: 'footer.rentals.trailer' },
  { routeName: 'vehicles-sexhjol', label: 'footer.rentals.sixWheeler' },
  { routeName: 'equipment-rafstodvar-og-rafmagn', label: 'footer.rentals.generators' },
  { routeName: 'equipment-hitablasarar', label: 'footer.rentals.heaters' },
]

const year = new Date().getFullYear()
</script>
