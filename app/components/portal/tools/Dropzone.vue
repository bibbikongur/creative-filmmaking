<template>
  <div>
    <!-- Drop / pick zone -->
    <label
      class="flex flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors"
      :class="dragging ? 'border-gold-500 bg-gold-500/5' : 'border-ink-700 hover:border-ink-600 bg-ink-900/40'"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <svg class="w-8 h-8 text-bone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      <span class="text-sm text-bone-300">{{ label || $t('portal.tools.dropHint') }}</span>
      <span v-if="hint" class="text-xs text-bone-500">{{ hint }}</span>
      <input
        ref="input"
        type="file"
        class="hidden"
        :accept="accept"
        :multiple="multiple"
        @change="onPick"
      >
    </label>

    <!-- Selected files -->
    <ul v-if="modelValue.length" class="mt-4 border border-ink-800 divide-y divide-ink-800">
      <li
        v-for="(f, i) in modelValue"
        :key="`${f.name}-${i}`"
        class="flex items-center gap-3 p-3 bg-ink-900/50"
      >
        <span class="min-w-0 flex-1 truncate text-sm text-bone-100">{{ f.name }}</span>
        <span class="text-xs text-bone-500 shrink-0">{{ formatBytes(f.size) }}</span>
        <div v-if="reorderable" class="flex items-center gap-1 shrink-0">
          <button
            type="button"
            class="px-1.5 text-bone-500 hover:text-gold-400 disabled:opacity-30 disabled:hover:text-bone-500"
            :disabled="i === 0"
            :aria-label="$t('portal.tools.moveUp')"
            @click="move(i, -1)"
          >↑</button>
          <button
            type="button"
            class="px-1.5 text-bone-500 hover:text-gold-400 disabled:opacity-30 disabled:hover:text-bone-500"
            :disabled="i === modelValue.length - 1"
            :aria-label="$t('portal.tools.moveDown')"
            @click="move(i, 1)"
          >↓</button>
        </div>
        <button
          type="button"
          class="px-1.5 text-bone-500 hover:text-signal-500 shrink-0"
          :aria-label="$t('portal.tools.remove')"
          @click="remove(i)"
        >✕</button>
      </li>
    </ul>

    <button
      v-if="modelValue.length"
      type="button"
      class="mt-3 text-xs uppercase tracking-widest text-bone-500 hover:text-signal-500 transition-colors"
      @click="clearAll"
    >
      {{ $t('portal.tools.clearAll') }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: File[]
  accept?: string
  multiple?: boolean
  reorderable?: boolean
  label?: string
  hint?: string
}>(), {
  accept: '',
  multiple: true,
  reorderable: false,
  label: '',
  hint: '',
})

const emit = defineEmits<{ 'update:modelValue': [File[]] }>()

const input = ref<HTMLInputElement | null>(null)
const dragging = ref(false)

const accepted = (list: FileList | null): File[] => {
  if (!list) return []
  let files = Array.from(list)
  // Enforce the accept filter on dropped files (the OS honours it for the picker,
  // but drag-and-drop bypasses it).
  if (props.accept) {
    const rules = props.accept.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    files = files.filter((f) => {
      const name = f.name.toLowerCase()
      const type = f.type.toLowerCase()
      return rules.some((r) => {
        if (r.startsWith('.')) return name.endsWith(r)
        if (r.endsWith('/*')) return type.startsWith(r.slice(0, -1))
        return type === r
      })
    })
  }
  return files
}

const add = (incoming: File[]) => {
  if (!incoming.length) return
  emit('update:modelValue', props.multiple ? [...props.modelValue, ...incoming] : incoming.slice(0, 1))
}

const onPick = (e: Event) => {
  add(accepted((e.target as HTMLInputElement).files))
  if (input.value) input.value.value = '' // allow re-picking the same file
}

const onDrop = (e: DragEvent) => {
  dragging.value = false
  add(accepted(e.dataTransfer?.files ?? null))
}

const remove = (i: number) => emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
const clearAll = () => emit('update:modelValue', [])

const move = (i: number, dir: -1 | 1) => {
  const next = [...props.modelValue]
  const j = i + dir
  if (j < 0 || j >= next.length) return
  ;[next[i], next[j]] = [next[j]!, next[i]!]
  emit('update:modelValue', next)
}
</script>
