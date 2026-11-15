<template>
  <header class="pb-5 border-b border-ink-800">
    <!-- Breadcrumb trail: section first, then where you are inside it -->
    <nav v-if="crumbs?.length" aria-label="Breadcrumb" class="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-400">
      <template v-for="(c, i) in crumbs" :key="i">
        <span v-if="i" aria-hidden="true" class="text-ink-500">/</span>
        <NuxtLink v-if="c.to" :to="c.to" class="transition-colors hover:text-gold-400">{{ c.label }}</NuxtLink>
        <span v-else class="max-w-[16rem] truncate text-bone-400" :aria-current="i === crumbs.length - 1 ? 'page' : undefined">{{ c.label }}</span>
      </template>
    </nav>

    <!-- Reading order is always title, description, then (if they do not fit beside the title) actions.
         One compact button stays on the title's line at every width; a wide action group
         ("stack-actions") sits beside the title from lg up and under the description below that. -->
    <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4">
      <h1 class="font-heading text-2xl/[1.2] sm:text-[1.75rem]/[1.2] font-semibold uppercase tracking-wide text-bone-100" :class="stackActions || !$slots.actions ? 'col-span-2 lg:col-span-1' : ''">
        <slot name="title">{{ title }}</slot>
      </h1>
      <div
        v-if="$slots.actions"
        class="flex flex-wrap items-center gap-2 sm:gap-3"
        :class="stackActions ? 'col-span-2 row-start-3 mt-4 lg:col-span-1 lg:row-start-1 lg:col-start-2 lg:mt-0' : ''"
      >
        <slot name="actions" />
      </div>
      <p v-if="description || $slots.description" class="col-span-2 mt-2 max-w-3xl text-sm leading-relaxed text-bone-400">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
  </header>
</template>

<script setup lang="ts">
// The one page header every admin page uses: breadcrumb, title, the page's
// actions, and an optional one-line description.
defineProps<{
  title?: string
  description?: string
  crumbs?: { label: string, to?: string }[]
  /** For a wide action group (two buttons, a status control): under the description below lg */
  stackActions?: boolean
}>()
</script>
