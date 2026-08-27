<template>
  <div class="border border-ink-800 bg-ink-900/50 p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="kicker">{{ $t('portal.bulk.title') }}</p>
      <button v-if="matrix.length" type="button" class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors" @click="reset">
        {{ $t('portal.cancel') }}
      </button>
    </div>
    <p class="mt-2 text-sm text-bone-400">{{ $t('portal.bulk.hint') }}</p>

    <!-- Paste area -->
    <textarea
      v-if="!matrix.length"
      v-model="raw"
      class="input-dark mt-4 h-28 font-mono text-xs"
      :placeholder="$t('portal.bulk.placeholder')"
      @input="parse"
    />

    <!-- Preview with per-column mapping -->
    <template v-else>
      <div class="mt-4 overflow-x-auto border border-ink-800">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-ink-800 bg-ink-900">
              <th v-for="(_, c) in columnCount" :key="c" class="p-2 text-left font-normal">
                <select v-model="mapping[c]" class="input-dark !py-1 !text-xs">
                  <option value="skip">{{ $t('portal.bulk.skip') }}</option>
                  <option value="name">{{ $t('portal.crew.fullName') }}</option>
                  <option value="email">{{ $t('portal.members.email') }}</option>
                  <option value="role">{{ $t('portal.crew.role') }}</option>
                  <option value="phone">{{ $t('portal.crew.phone') }}</option>
                  <option value="dayRate">{{ $t('portal.members.dayRate') }}</option>
                  <option value="department">{{ $t('portal.departments.department') }}</option>
                </select>
              </th>
              <th class="p-2" />
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-800">
            <tr v-for="(row, r) in matrix" :key="r" :class="rowError(row) ? 'opacity-50' : ''">
              <td v-for="(_, c) in columnCount" :key="c" class="p-2 text-bone-100 whitespace-nowrap max-w-48 truncate">
                {{ row[c] ?? '' }}
              </td>
              <td class="p-2 text-signal-500 whitespace-nowrap">{{ rowError(row) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.bulk.defaultRate') }}</label>
          <input v-model.number="defaultRate" type="number" min="1" step="1" class="input-dark !w-40 text-right">
        </div>
        <button
          type="button"
          class="btn-gold disabled:opacity-60"
          :disabled="busy || !validRows.length"
          @click="submit"
        >
          {{ busy
            ? $t('portal.bulk.adding', { done: progress, total: validRows.length })
            : $t('portal.bulk.add', { n: validRows.length }) }}
        </button>
      </div>

      <p v-if="summary" class="mt-3 text-sm" :class="failures.length ? 'text-gold-400' : 'text-emerald-400'">{{ summary }}</p>
      <ul v-if="failures.length" class="mt-2 text-sm text-signal-500 list-disc pl-5">
        <li v-for="f in failures" :key="f">{{ f }}</li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Department } from '~/types'

// Paste rows straight from Google Sheets/Excel (tab-separated; ; or , as
// fallback). Columns are auto-detected from headers and content, adjustable
// per column. Each valid row is added through the normal add-member endpoint,
// so everyone gets the usual invitation email. Unknown departments are created.

type FieldKey = 'skip' | 'name' | 'email' | 'role' | 'phone' | 'dayRate' | 'department'

const props = defineProps<{ jobId: string, departments: Department[] }>()
const emit = defineEmits<{ added: [] }>()

const { t } = useI18n()

const raw = ref('')
const matrix = ref<string[][]>([])
const mapping = ref<FieldKey[]>([])
const defaultRate = ref<number>()
const busy = ref(false)
const progress = ref(0)
const summary = ref('')
const failures = ref<string[]>([])

const columnCount = computed(() => Math.max(0, ...matrix.value.map(r => r.length)))

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[\d\s()-]{7,}$/

const HEADER_HINTS: Record<Exclude<FieldKey, 'skip'>, string[]> = {
  name: ['nafn', 'name'],
  email: ['netfang', 'email', 'e-mail', 'póstur', 'postur'],
  role: ['starfsheiti', 'starf', 'role', 'title', 'position', 'staða'],
  phone: ['sími', 'simi', 'símanúmer', 'phone', 'gsm', 'tel'],
  dayRate: ['dagsgjald', 'dagsverð', 'rate', 'verð', 'laun', 'gjald'],
  department: ['deild', 'department', 'dept'],
}

const parseRate = (s: string): number | null => {
  const n = Number(s.replace(/kr\.?/i, '').replace(/[.\s]/g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

const parse = () => {
  const text = raw.value.trim()
  if (!text) return
  const lines = text.split(/\r?\n/).map(l => l.trimEnd()).filter(l => l.trim())
  if (!lines.length) return
  const delim = text.includes('\t') ? '\t' : (text.includes(';') ? ';' : ',')
  let rows = lines.map(l => l.split(delim).map(c => c.trim()))

  const cols = Math.max(...rows.map(r => r.length))
  const guess: FieldKey[] = Array.from({ length: cols }, () => 'skip')

  // Header row: no email address and at least one recognizable column name.
  const head = rows[0]!.map(c => c.toLowerCase())
  const hasHeader = !rows[0]!.some(c => EMAIL_RE.test(c))
    && head.some(h => Object.values(HEADER_HINTS).some(hints => hints.some(k => h.includes(k))))
  if (hasHeader) {
    head.forEach((h, i) => {
      for (const [field, hints] of Object.entries(HEADER_HINTS) as [Exclude<FieldKey, 'skip'>, string[]][]) {
        if (hints.some(k => h.includes(k)) && !guess.includes(field)) guess[i] = field
      }
    })
    rows = rows.slice(1)
  }

  // Content-based guesses for anything the header didn't settle.
  const body = rows.slice(0, 25)
  const mostly = (i: number, test: (c: string) => boolean) => {
    const cells = body.map(r => r[i] ?? '').filter(Boolean)
    return cells.length > 0 && cells.filter(test).length / cells.length >= 0.6
  }
  for (let i = 0; i < cols; i++) {
    if (guess[i] !== 'skip') continue
    if (!guess.includes('email') && mostly(i, c => EMAIL_RE.test(c))) guess[i] = 'email'
    else if (!guess.includes('dayRate') && mostly(i, c => parseRate(c) !== null && !PHONE_RE.test(c))) guess[i] = 'dayRate'
    else if (!guess.includes('phone') && mostly(i, c => PHONE_RE.test(c))) guess[i] = 'phone'
  }
  // Leftover text columns in reading order: name, then role, then department.
  for (const field of ['name', 'role', 'department'] as const) {
    if (guess.includes(field)) continue
    const i = guess.findIndex((g, idx) => g === 'skip' && body.some(r => (r[idx] ?? '').trim()))
    if (i !== -1) guess[i] = field
  }

  matrix.value = rows
  mapping.value = guess
}

const col = (field: FieldKey) => mapping.value.indexOf(field)

const rowValue = (row: string[], field: FieldKey): string => {
  const i = col(field)
  return i === -1 ? '' : (row[i] ?? '').trim()
}

const rowRate = (row: string[]): number | null => {
  const cell = rowValue(row, 'dayRate')
  return (cell ? parseRate(cell) : null) ?? (defaultRate.value && defaultRate.value > 0 ? Math.round(defaultRate.value) : null)
}

const rowError = (row: string[]): string => {
  if (!EMAIL_RE.test(rowValue(row, 'email'))) return t('portal.bulk.noEmail')
  if (rowRate(row) === null) return t('portal.bulk.noRate')
  return ''
}

const validRows = computed(() => matrix.value.filter(r => !rowError(r)))

const reset = () => {
  raw.value = ''
  matrix.value = []
  mapping.value = []
  summary.value = ''
  failures.value = []
  progress.value = 0
}

const submit = async () => {
  busy.value = true
  summary.value = ''
  failures.value = []
  progress.value = 0
  try {
    // Create any departments the paste mentions that don't exist yet.
    const deptIds = new Map(props.departments.map(d => [d.name.toLowerCase(), d.id]))
    const wanted = [...new Set(validRows.value.map(r => rowValue(r, 'department')).filter(Boolean))]
    for (const deptName of wanted) {
      if (deptIds.has(deptName.toLowerCase())) continue
      try {
        const created = await $fetch<Department>(`/api/portal/jobs/${props.jobId}/departments`, {
          method: 'POST',
          body: { name: deptName },
        })
        deptIds.set(created.name.toLowerCase(), created.id)
      }
      catch (e: any) {
        failures.value.push(`${deptName}: ${e?.data?.data?.errors?.[0] || e?.data?.statusMessage || t('portal.loadFailed')}`)
      }
    }

    let added = 0
    for (const row of validRows.value) {
      const email = rowValue(row, 'email')
      try {
        await $fetch(`/api/portal/jobs/${props.jobId}/members`, {
          method: 'POST',
          body: {
            email,
            name: rowValue(row, 'name') || undefined,
            role: rowValue(row, 'role') || undefined,
            phone: rowValue(row, 'phone') || undefined,
            dayRate: rowRate(row),
            departmentId: deptIds.get(rowValue(row, 'department').toLowerCase()) ?? null,
            locale: 'is',
          },
        })
        added++
      }
      catch (e: any) {
        failures.value.push(`${email}: ${e?.data?.data?.errors?.[0] || e?.data?.statusMessage || t('portal.loadFailed')}`)
      }
      progress.value++
    }

    summary.value = t('portal.bulk.done', { added, failed: failures.value.length })
    emit('added')
    if (!failures.value.length) {
      raw.value = ''
      matrix.value = []
      mapping.value = []
    }
  }
  finally {
    busy.value = false
  }
}
</script>
