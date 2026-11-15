<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="shrink-0"
    :width="size"
    :height="size"
    v-html="paths[name]"
  />
</template>

<script setup lang="ts">
// The admin panel's icon set: 24px grid, 1.6 stroke, currentColor.
// Static markup only (never user input), so v-html is safe here.
export type AdminIconName = keyof typeof paths

withDefaults(defineProps<{ name: AdminIconName, size?: number | string }>(), { size: 18 })
</script>

<script lang="ts">
const paths = {
  overview: '<rect x="3.5" y="3.5" width="7" height="8"/><rect x="13.5" y="3.5" width="7" height="5"/><rect x="13.5" y="11.5" width="7" height="9"/><rect x="3.5" y="14.5" width="7" height="6"/>',
  vehicles: '<path d="M2.5 6.5h11v10h-11z"/><path d="M13.5 9.5h4l4 4v3h-8z"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
  equipment: '<path d="M3.5 8.5h3l1.5-2.5h8l1.5 2.5h3v10.5h-17z"/><circle cx="12" cy="13.5" r="3.2"/>',
  categories: '<path d="M3.5 5.5h7l2 2.5h8v11h-17z"/>',
  quotes: '<path d="M3.5 5.5h17v13h-17z"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  rentals: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  contracts: '<path d="M6 3.5h8.5l4 4v13H6z"/><path d="M14.5 3.5v4h4M9 12.5h6.5M9 16h6.5"/>',
  companies: '<circle cx="9" cy="8.5" r="3"/><path d="M3 19.5c.5-3.4 2.8-5 6-5s5.5 1.6 6 5"/><circle cx="17" cy="9.5" r="2.3"/><path d="M17.5 14.600c2 .3 3.2 1.7 3.5 4.4"/>',
  security: '<path d="M12 3.5 5 6v5.500c0 4.3 2.8 7.3 7 9 4.2-1.7 7-4.7 7-9V6z"/><path d="m9.3 12 2 2 3.5-3.8"/>',
  external: '<path d="M10 5.500H5.500v13h13V14"/><path d="M13.5 4.500h6v6M19.5 4.500l-8 8"/>',
  logout: '<path d="M13.5 4.500h-8v15h8"/><path d="M10 12h10.500M17 8.500l3.5 3.5-3.5 3.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.500h5V7M6.5 7l.8 12.500h9.400L17.5 7M10 10.500v5.500M14 10.500v5.5"/>',
  edit: '<path d="M4.5 19.500l1-4.500L16 4.500l3.5 3.500L9 18.500z"/><path d="m13.5 7 3.5 3.5"/>',
  up: '<path d="m6 14.5 6-6 6 6"/>',
  down: '<path d="m6 9.5 6 6 6-6"/>',
  right: '<path d="m9.5 6 6 6-6 6"/>',
  forward: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  upload: '<path d="M12 16V4.5M7 9.5l5-5 5 5M4.5 15.5v4h15v-4"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  pdf: '<path d="M6 3.500h8.500l4 4v13H6z"/><path d="M14.5 3.500v4h4"/><path d="M9 16.500v-4h1.200a1.2 1.2 0 0 1 0 2.400H9M13.5 12.500v4M13.5 12.500h1a2 2 0 0 1 0 4h-1"/>',
  print: '<path d="M7 8.500v-5h10v5M7 16.500H4.500v-8h15v8H17"/><path d="M7 13.500h10v7H7z"/>',
  mail: '<path d="M3.5 5.500h17v13h-17z"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  check: '<path d="m5 12.5 4.5 4.500L19 7.5"/>',
} as const
</script>
