<template>
  <div>
    <div class="drag-region" data-tauri-drag-region />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
useHead({
  meta: [
    { name: 'theme-color', content: '#eff6ff', media: '(prefers-color-scheme: light)' },
    { name: 'theme-color', content: '#292524', media: '(prefers-color-scheme: dark)' },
  ],
});
</script>

<style scoped>
/* Drag region for Tauri window */
.drag-region {
  @apply h-full w-full inset-0 fixed -z-0;
}
</style>

<style>
/* CSS Variables */
:root {
  /* Timing constants */
  --timing-race-expire: 60000;
  --timing-race-critical: 60000;
  --timing-race-starting-soon: 300000;
  --timing-refresh-interval: 30000;
  --timing-expiration-check: 10000;

  /* Transition durations */
  --transition-fast: 200ms;
  --transition-base: 300ms;
  --transition-slow: 500ms;

  /* Border radius */
  --radius-base: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1rem;
  --radius-3xl: 1.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-card: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-card-hover: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* Z-index layers */
  --z-base: 1;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;
}

/* Global styles */
html,
body {
  @apply bg-gray-200/70 md:bg-blue-50 dark:bg-gray-900;
  scroll-behavior: smooth;
  overscroll-behavior: none;
}

#__nuxt {
  @apply bg-gradient-to-b lg:bg-gradient-to-br md:from-gray-200 md:to-gray-200 md:via-gray-200/50;
  @apply dark:bg-gradient-to-br lg:dark:from-gray-900 dark:to-gray-800;
  @apply dark:to-gray-900 dark:via-gray-900 dark:from-gray-900 md:dark:to-gray-800;
  @apply min-h-screen flex items-center justify-center overflow-hidden;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
