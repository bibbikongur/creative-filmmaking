<template>
  <PortalToolsShell
    :title="$t('portal.tools.recce.title')"
    :desc="$t('portal.tools.recce.long')"
    :back-to="jobId ? localePath(`/portal/jobs/${jobId}`) : undefined"
    :back-label="jobId ? $t('portal.tools.backToJob') : undefined"
  >
    <!-- Create new plan -->
    <form class="flex flex-wrap gap-3" @submit.prevent="create">
      <input
        v-model="newName"
        type="text"
        class="input-dark flex-1 min-w-56"
        :placeholder="$t('portal.tools.recce.namePlaceholder')"
        maxlength="120"
      >
      <button type="submit" class="btn-gold disabled:opacity-50" :disabled="!newName.trim() || creating">
        {{ creating ? $t('portal.tools.working') : $t('portal.tools.recce.newPlan') }}
      </button>
    </form>

    <p v-if="error" class="mt-4 text-sm text-signal-500">{{ error }}</p>

    <!-- Saved plans -->
    <div v-if="plans.length" class="mt-8 divide-y divide-ink-800 border border-ink-800">
      <div
        v-for="p in plans"
        :key="p.id"
        class="flex items-center gap-4 p-4 hover:bg-ink-900 transition-colors"
      >
        <NuxtLink :to="docLink(p.id)" class="flex-1 min-w-0">
          <p class="font-semibold text-bone-100 truncate">{{ p.name }}</p>
          <p class="mt-0.5 text-xs text-bone-500">
            {{ $t('portal.tools.recce.stopCount', { n: p.stopCount }, p.stopCount) }}
            · {{ $t('portal.tools.recce.updated') }} {{ formatDate(p.updatedAt) }}
          </p>
        </NuxtLink>
        <NuxtLink
          :to="docLink(p.id)"
          class="text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors"
        >
          {{ $t('portal.tools.open') }} →
        </NuxtLink>
        <button
          type="button"
          class="text-bone-600 hover:text-signal-500 transition-colors"
          :title="$t('portal.tools.remove')"
          @click="remove(p)"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
          </svg>
        </button>
      </div>
    </div>
    <p v-else-if="loaded" class="mt-8 text-sm text-bone-500">{{ $t('portal.tools.recce.empty') }}</p>
  </PortalToolsShell>
</template>

<script setup lang="ts">
import type { ReccePlanDoc, ReccePlanStop, ReccePlanSummary } from '~/types'

definePageMeta({ layout: 'portal' })
usePortalToolGuard('recce-plan')

const { t, locale } = useI18n()
const { confirmDialog } = useAppDialog()
const localePath = useLocalePath()
const route = useRoute()

// Job scope (?job=): the list shows only this job's plans and new plans are
// linked to it ("Hjálpargögn" on the job page).
const jobId = computed(() => (typeof route.query.job === 'string' ? route.query.job : ''))
const docLink = (id: string) =>
  localePath({ path: `/portal/tools/recce-plan/${id}`, query: jobId.value ? { job: jobId.value } : {} })

const plans = ref<ReccePlanSummary[]>([])
const loaded = ref(false)
const newName = ref('')
const creating = ref(false)
const error = ref('')

const load = async () => {
  try {
    plans.value = await $fetch<ReccePlanSummary[]>('/api/portal/tools/recce-plans', {
      query: jobId.value ? { job: jobId.value } : {},
    })
  }
  catch {
    error.value = t('portal.tools.recce.loadFailed')
  }
  finally {
    loaded.value = true
  }
}

// ── One-time migration of the pre-server localStorage draft ──────────────────
// The tool used to keep a single browser-local draft under `cf-recce-plan`.
// If one is found it becomes a saved plan on the account and the key is
// removed, so nothing the user typed is lost.
const DRAFT_KEY = 'cf-recce-plan'
const parseHM = (s: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const migrateDraft = async () => {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(DRAFT_KEY)
  }
  catch { return }
  if (!raw) return
  try {
    const d = JSON.parse(raw) as Record<string, unknown>
    const stopsRaw = Array.isArray(d.stops) ? d.stops as Record<string, unknown>[] : []
    const stops: ReccePlanStop[] = stopsRaw.map((s, i) => {
      // Very old drafts stored absolute times instead of durations.
      const arr = parseHM(String(s.time || ''))
      const dep = parseHM(String(s.endTime || ''))
      const nextArr = parseHM(String(stopsRaw[i + 1]?.time || ''))
      const legacyDuration = arr !== null && dep !== null ? Math.max(0, dep - arr) : 60
      const legacyEnd = dep ?? (arr !== null ? arr + legacyDuration : null)
      return {
        name: String(s.name || ''),
        address: String(s.address || ''),
        notes: String(s.notes || ''),
        link: String(s.link || ''),
        coords: String(s.coords || ''),
        photos: Array.isArray(s.photos) ? s.photos as string[] : [],
        durationMin: typeof s.durationMin === 'number' ? s.durationMin : legacyDuration,
        travelMin: typeof s.travelMin === 'number'
          ? s.travelMin
          : nextArr !== null && legacyEnd !== null ? Math.max(0, nextArr - legacyEnd) : 30,
      }
    })
    const hasContent = stops.some(s => s.name || s.address || s.notes) || String(d.project || '').trim()
    if (hasContent) {
      await $fetch<ReccePlanDoc>('/api/portal/tools/recce-plans', {
        method: 'POST',
        body: {
          name: String(d.project || '').trim() || t('portal.tools.recce.title'),
          data: {
            subtitle: String(d.subtitle || ''),
            date: String(d.date || ''),
            startTime: String(d.startTime || '08:00'),
            note: String(d.note || ''),
            stops,
            contacts: Array.isArray(d.contacts) ? d.contacts : [],
          },
        },
      })
    }
    localStorage.removeItem(DRAFT_KEY)
  }
  catch { /* unreadable draft — leave it alone */ }
}

onMounted(async () => {
  await migrateDraft()
  await load()
})

const create = async () => {
  if (!newName.value.trim() || creating.value) return
  creating.value = true
  error.value = ''
  try {
    const doc = await $fetch<ReccePlanDoc>('/api/portal/tools/recce-plans', {
      method: 'POST',
      body: { name: newName.value.trim(), ...(jobId.value ? { jobId: jobId.value } : {}) },
    })
    await navigateTo(docLink(doc.id))
  }
  catch {
    error.value = t('portal.tools.recce.saveFailed')
    creating.value = false
  }
}

const remove = async (p: ReccePlanSummary) => {
  if (!await confirmDialog(t('portal.tools.recce.confirmDelete'))) return
  try {
    await $fetch(`/api/portal/tools/recce-plans/${p.id}`, { method: 'DELETE' })
    plans.value = plans.value.filter(x => x.id !== p.id)
  }
  catch {
    error.value = t('portal.tools.recce.saveFailed')
  }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value === 'is' ? 'is-IS' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

useHead({ title: 'Recce áætlun · Hjálpartól · Portal' })
</script>
