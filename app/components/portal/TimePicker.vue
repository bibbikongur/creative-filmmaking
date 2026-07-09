<template>
  <div ref="root" class="relative inline-block">
    <div class="flex items-center gap-1">
      <input
        :id="id"
        ref="field"
        v-model="text"
        type="text"
        inputmode="numeric"
        placeholder="--:--"
        maxlength="5"
        class="input-dark !w-20 text-center tabular-nums"
        :disabled="disabled"
        @change="commitText"
        @keydown.enter.prevent="commitText"
        @focus="selectAll"
      >
      <button
        type="button"
        class="shrink-0 text-bone-400 hover:text-gold-400 transition-colors disabled:opacity-40"
        :disabled="disabled"
        :aria-label="$t('portal.timePicker.open')"
        @click="toggle"
      >
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <!-- Clock popup -->
    <div
      v-if="open"
      class="absolute z-30 mt-2 w-72 border border-ink-700 bg-ink-900 p-4 shadow-2xl"
      @keydown.esc="done"
    >
      <!-- Selected time + mode switch -->
      <div class="flex items-center justify-center gap-1 text-3xl font-semibold tabular-nums">
        <button
          type="button"
          class="px-1 transition-colors"
          :class="mode === 'hour' ? 'text-gold-400' : 'text-bone-400 hover:text-bone-100'"
          @click="mode = 'hour'"
        >
          {{ pad(hour) }}
        </button>
        <span class="text-bone-400">:</span>
        <button
          type="button"
          class="px-1 transition-colors"
          :class="mode === 'minute' ? 'text-gold-400' : 'text-bone-400 hover:text-bone-100'"
          @click="mode = 'minute'"
        >
          {{ pad(minute) }}
        </button>
      </div>
      <p class="mt-1 text-center text-[11px] uppercase tracking-widest text-bone-400">
        {{ mode === 'hour' ? $t('portal.timePicker.hour') : $t('portal.timePicker.minute') }}
      </p>

      <!-- Clock face -->
      <svg viewBox="0 0 240 240" class="mt-3 w-full select-none">
        <circle cx="120" cy="120" r="116" class="fill-ink-950 stroke-ink-800" />
        <!-- hand -->
        <line x1="120" y1="120" :x2="hand.x" :y2="hand.y" class="stroke-gold-600" stroke-width="2" />
        <circle cx="120" cy="120" r="3" class="fill-gold-500" />
        <circle :cx="hand.x" :cy="hand.y" r="15" class="fill-gold-600/30 stroke-gold-500" />

        <g v-if="mode === 'hour'">
          <g v-for="p in positions(94)" :key="`h-out-${p.i}`" @click="pickHour(p.i === 0 ? 12 : p.i)">
            <circle :cx="p.x" :cy="p.y" r="15" class="fill-transparent cursor-pointer" />
            <text :x="p.x" :y="p.y" text-anchor="middle" dominant-baseline="central"
                  class="pointer-events-none text-[13px] tabular-nums"
                  :class="hour === (p.i === 0 ? 12 : p.i) ? 'fill-ink-950 font-semibold' : 'fill-bone-100'">
              {{ p.i === 0 ? 12 : p.i }}
            </text>
          </g>
          <g v-for="p in positions(60)" :key="`h-in-${p.i}`" @click="pickHour(p.i === 0 ? 0 : p.i + 12)">
            <circle :cx="p.x" :cy="p.y" r="14" class="fill-transparent cursor-pointer" />
            <text :x="p.x" :y="p.y" text-anchor="middle" dominant-baseline="central"
                  class="pointer-events-none text-[11px] tabular-nums"
                  :class="hour === (p.i === 0 ? 0 : p.i + 12) ? 'fill-ink-950 font-semibold' : 'fill-bone-400'">
              {{ pad(p.i === 0 ? 0 : p.i + 12) }}
            </text>
          </g>
        </g>

        <g v-else>
          <g v-for="p in positions(94)" :key="`m-${p.i}`" @click="pickMinute(p.i * 5)">
            <circle :cx="p.x" :cy="p.y" r="16" class="fill-transparent cursor-pointer" />
            <text :x="p.x" :y="p.y" text-anchor="middle" dominant-baseline="central"
                  class="pointer-events-none text-[13px] tabular-nums"
                  :class="minute === p.i * 5 ? 'fill-ink-950 font-semibold' : 'fill-bone-100'">
              {{ pad(p.i * 5) }}
            </text>
          </g>
        </g>
      </svg>

      <div class="mt-2 flex justify-end gap-4 text-xs uppercase tracking-widest">
        <button type="button" class="text-bone-400 hover:text-bone-100 transition-colors" @click="cancel">
          {{ $t('portal.timePicker.cancel') }}
        </button>
        <button type="button" class="text-gold-400 hover:text-gold-500 transition-colors" @click="done">
          {{ $t('portal.timePicker.done') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string, disabled?: boolean, id?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const pad = (n: number) => String(n).padStart(2, '0')

const parse = (v: string): { h: number, m: number } | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(v.trim())
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  return h >= 0 && h < 24 && m >= 0 && m < 60 ? { h, m } : null
}

const root = ref<HTMLElement | null>(null)
const field = ref<HTMLInputElement | null>(null)
const open = ref(false)
const mode = ref<'hour' | 'minute'>('hour')
const text = ref(props.modelValue)
const hour = ref(0)
const minute = ref(0)

watch(() => props.modelValue, (v) => { text.value = v })

// Numbers sit at 12 positions (0 = top, clockwise); `r` is the ring radius.
const positions = (r: number) => Array.from({ length: 12 }, (_, i) => {
  const angle = (i * 30 - 90) * Math.PI / 180
  return { i, x: 120 + r * Math.cos(angle), y: 120 + r * Math.sin(angle) }
})

const hand = computed(() => {
  const r = mode.value === 'hour'
    ? (hour.value === 0 || hour.value > 12 ? 60 : 94)
    : 94
  const step = mode.value === 'hour' ? (hour.value % 12) : (minute.value / 5)
  const angle = (step * 30 - 90) * Math.PI / 180
  return { x: 120 + r * Math.cos(angle), y: 120 + r * Math.sin(angle) }
})

const commitText = () => {
  const parsed = parse(text.value)
  if (parsed) {
    hour.value = parsed.h
    minute.value = parsed.m
    text.value = `${pad(parsed.h)}:${pad(parsed.m)}`
    emit('update:modelValue', text.value)
  }
  else if (text.value.trim() === '') {
    emit('update:modelValue', '')
  }
  else {
    text.value = props.modelValue // reject garbage
  }
}

const selectAll = () => field.value?.select()

const toggle = () => {
  if (props.disabled) return
  if (open.value) { done(); return }
  const parsed = parse(text.value)
  hour.value = parsed?.h ?? 8
  minute.value = parsed?.m ?? 0
  mode.value = 'hour'
  open.value = true
}

const pickHour = (h: number) => {
  hour.value = h
  mode.value = 'minute'
}

const pickMinute = (m: number) => {
  minute.value = m
}

const done = () => {
  text.value = `${pad(hour.value)}:${pad(minute.value)}`
  emit('update:modelValue', text.value)
  open.value = false
}

const cancel = () => {
  open.value = false
  text.value = props.modelValue
}

const onOutside = (e: MouseEvent) => {
  if (open.value && root.value && !root.value.contains(e.target as Node)) done()
}
onMounted(() => document.addEventListener('mousedown', onOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onOutside))
</script>
