<template>
  <footer class="bg-ink-900 border-t border-ink-800">
    <div class="wrap py-14">
      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Brand -->
        <div>
          <NuxtLink :to="localePath('/')" class="inline-flex items-center">
            <img
              src="/logo-cf-rentals-dark.png"
              alt="CF Rentals · Creative Filmmaking"
              class="h-10 w-auto"
              width="811"
              height="124"
              loading="lazy"
            >
          </NuxtLink>
          <p class="mt-4 text-sm text-bone-400 leading-relaxed max-w-xs">
            {{ t('footer.tagline') }}
          </p>
        </div>

        <!-- Site nav -->
        <div>
          <h2 class="kicker mb-4">{{ t('footer.navTitle') }}</h2>
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
          <h2 class="kicker mb-4">{{ t('footer.rentalsTitle') }}</h2>
          <ul class="space-y-2.5">
            <li v-for="link in rentalLinks" :key="link.label">
              <NuxtLink
                :to="link.to"
                class="text-sm text-bone-400 hover:text-gold-400 transition-colors"
              >
                {{ t(link.label) }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h2 class="kicker mb-4">{{ t('footer.contactTitle') }}</h2>
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
        <p>{{ t('hero.kicker') }}</p>
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
// page. The landings link on to the individual vehicles and items. Equipment
// categories live in the database, so their links resolve by category id and
// simply drop out if the category is archived.
const { byId: equipmentCategory, path: categoryPath } = await useEquipmentCategories()
// Category id -> the phrase people search for (the bare category name, as on
// the hub, gives the page no anchor text for it).
const CATEGORY_LABELS = {
  power: 'footer.rentals.generators',
  heating: 'footer.rentals.heaters',
  safety: 'footer.rentals.cones',
  furniture: 'footer.rentals.tables',
  shelter: 'footer.rentals.tents',
  lighting: 'footer.rentals.lights',
} as const
const rentalLinks = computed(() => [
  { to: localePath({ name: 'vehicles-kassabilar' }), label: 'footer.rentals.boxTrucks' },
  { to: localePath({ name: 'vehicles-sendibilar' }), label: 'footer.rentals.van' },
  { to: localePath({ name: 'vehicles-hjolhysi' }), label: 'footer.rentals.caravans' },
  { to: localePath({ name: 'vehicles-kerrur' }), label: 'footer.rentals.trailer' },
  { to: localePath({ name: 'vehicles-pallbilar' }), label: 'footer.rentals.pickup' },
  { to: localePath({ name: 'vehicles-sexhjol' }), label: 'footer.rentals.sixWheeler' },
  ...(Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]).flatMap((id) => {
    const c = equipmentCategory(id)
    return c ? [{ to: categoryPath(c), label: CATEGORY_LABELS[id] }] : []
  }),
])

const year = new Date().getFullYear()
</script>
