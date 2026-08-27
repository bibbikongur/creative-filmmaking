import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Nuxt path aliases for plain vitest runs (no Nuxt runtime): lets tests and
// server utils import app-level modules the same way the app does.
export default defineConfig({
  resolve: {
    alias: {
      '~~': fileURLToPath(new URL('.', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
})
