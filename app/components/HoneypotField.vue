<template>
  <!--
    Honeypot: invisible to real users (off-screen, not tab-focusable, no
    autofill), but naive bots fill it. The backend silently drops any
    submission where this field ("website") comes back non-empty.
  -->
  <div aria-hidden="true" class="pointer-events-none absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden opacity-0">
    <label :for="fieldId">Leave this field blank</label>
    <input
      :id="fieldId"
      name="website"
      :value="modelValue"
      type="text"
      tabindex="-1"
      autocomplete="off"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()

const fieldId = useId()
</script>
