<template>
  <div>
    <div>
      <p class="kicker">{{ $t('portal.nav.access') }}</p>
      <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.access.title') }}</h1>
      <p class="mt-2 text-sm text-bone-400 max-w-2xl">{{ $t('portal.access.intro') }}</p>
    </div>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="mt-8 text-sm text-bone-400">{{ $t('portal.loading') }}</p>

    <template v-else>
      <input
        v-model="query"
        type="search"
        :placeholder="$t('portal.access.search')"
        class="input-dark mt-8 max-w-sm"
      >

      <div class="mt-4 border border-ink-800 divide-y divide-ink-800">
        <div v-for="u in filtered" :key="u.id" class="p-4 bg-ink-900/50">
          <div class="flex flex-wrap items-center gap-3">
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-bone-100 truncate">
                {{ u.name || u.email }}
                <span v-if="u.isAdmin" class="ml-2 text-[10px] uppercase tracking-widest text-gold-500 border border-gold-500/40 px-1.5 py-0.5">{{ $t('portal.access.admin') }}</span>
              </p>
              <p class="mt-0.5 text-xs text-bone-400 truncate">
                {{ u.email }}<span v-if="u.jobs.length"> · {{ u.jobs.join(', ') }}</span>
              </p>
            </div>

            <div class="flex items-center gap-3 text-xs uppercase tracking-widest">
              <span v-if="saving[u.id]" class="text-bone-500">{{ $t('portal.access.saving') }}</span>
              <span v-else-if="savedFlash[u.id]" class="text-gold-400">{{ $t('portal.access.saved') }}</span>
              <span v-if="saveError[u.id]" class="text-signal-500 normal-case tracking-normal">{{ saveError[u.id] }}</span>
              <button
                v-if="!u.isAdmin"
                type="button"
                class="transition-colors"
                :class="u.tools === null ? 'text-gold-400' : 'text-bone-400 hover:text-gold-400'"
                @click="toggleAll(u)"
              >
                {{ u.tools === null ? $t('portal.access.allOn') : $t('portal.access.enableAll') }}
              </button>
            </div>
          </div>

          <p v-if="u.isAdmin" class="mt-3 text-xs text-bone-500">{{ $t('portal.access.adminNote') }}</p>

          <div v-else class="mt-3 space-y-2">
            <div v-for="group in toolGroups" :key="group.key" class="flex flex-wrap items-center gap-2">
              <span class="w-28 shrink-0 text-[10px] uppercase tracking-widest text-bone-500">{{ $t(group.labelKey) }}</span>
              <button
                v-for="tool in group.tools"
                :key="tool.slug"
                type="button"
                class="flex items-center gap-1.5 border px-2.5 py-1.5 text-xs transition-colors"
                :class="hasTool(u, tool.slug)
                  ? 'border-gold-500/60 bg-gold-500/10 text-gold-400'
                  : 'border-ink-700 text-bone-500 hover:border-ink-600 hover:text-bone-300'"
                :aria-pressed="hasTool(u, tool.slug)"
                @click="toggleTool(u, tool.slug)"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path :d="tool.icon" />
                </svg>
                {{ $t(tool.titleKey) }}
              </button>
            </div>
          </div>
        </div>

        <p v-if="!filtered.length" class="p-8 text-center text-sm text-bone-400">{{ $t('portal.access.empty') }}</p>
      </div>

      <p class="mt-4 text-xs text-bone-500">{{ $t('portal.access.hint') }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal' })

interface AccessUser {
  id: string
  email: string
  name?: string
  status: string
  jobs: string[]
  isAdmin: boolean
  tools: string[] | null
}

const { t } = useI18n()
const { portalTools, toolCategories } = usePortalTools()
// Chips grouped the same way as the job page's tools grid.
const toolGroups = toolCategories.map(cat => ({ ...cat, tools: portalTools.filter(tool => tool.category === cat.key) }))
const { isCompanyAdmin, authed } = usePortalAuth()
const localePath = useLocalePath()

// Admin-only page: members get bounced to the job list.
watchEffect(() => {
  if (authed.value && !isCompanyAdmin.value) navigateTo(localePath('/portal/jobs'))
})

const users = ref<AccessUser[]>([])
const loaded = ref(false)
const loadError = ref('')
const query = ref('')
const saving = reactive<Record<string, boolean>>({})
const savedFlash = reactive<Record<string, boolean>>({})
const saveError = reactive<Record<string, string>>({})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    (u.name ?? '').toLowerCase().includes(q)
    || u.email.toLowerCase().includes(q)
    || u.jobs.some(j => j.toLowerCase().includes(q)),
  )
})

const hasTool = (u: AccessUser, slug: string) => u.tools === null || u.tools.includes(slug)

let flashTimers: Record<string, ReturnType<typeof setTimeout>> = {}

const save = async (u: AccessUser) => {
  saving[u.id] = true
  saveError[u.id] = ''
  try {
    await $fetch(`/api/portal/access/users/${u.id}`, { method: 'PUT', body: { tools: u.tools } })
    savedFlash[u.id] = true
    clearTimeout(flashTimers[u.id])
    flashTimers[u.id] = setTimeout(() => { savedFlash[u.id] = false }, 1500)
  }
  catch (e: any) {
    saveError[u.id] = e?.data?.statusMessage || t('portal.access.saveFailed')
  }
  finally {
    saving[u.id] = false
  }
}

const toggleTool = (u: AccessUser, slug: string) => {
  // "All" (null) becomes an explicit list minus the toggled tool.
  if (u.tools === null) {
    u.tools = portalTools.map(tool => tool.slug).filter(s => s !== slug)
  }
  else if (u.tools.includes(slug)) {
    u.tools = u.tools.filter(s => s !== slug)
  }
  else {
    u.tools = [...u.tools, slug]
    // Back to every tool → store the default again.
    if (u.tools.length === portalTools.length) u.tools = null
  }
  save(u)
}

const toggleAll = (u: AccessUser) => {
  if (u.tools === null) return
  u.tools = null
  save(u)
}

onMounted(async () => {
  try {
    users.value = await $fetch<AccessUser[]>('/api/portal/access/users', { query: { t: Date.now() } })
    loaded.value = true
  }
  catch (e: any) {
    loadError.value = e?.data?.statusMessage || t('portal.loadFailed')
  }
})

useHead({ title: 'Aðgangur · Portal · Creative Filmmaking' })
</script>
