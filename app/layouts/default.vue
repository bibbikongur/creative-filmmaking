<template>
  <div class="min-h-screen flex flex-col bg-ink-950">
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] btn-gold btn-sm">
      {{ $t('common.skipToContent') }}
    </a>
    <SiteHeader />
    <main id="main" tabindex="-1" class="flex-1 focus:outline-none">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
