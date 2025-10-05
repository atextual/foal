<template>
  <div class="racing-page">
    <!-- HUD Display -->
    <div class="racing-page__hud">
      <RaceHUD />
    </div>

    <!-- Filters -->
    <div class="racing-page__filters">
      <CategoryFilter />
    </div>

    <!-- Race Cards -->
    <div class="racing-page__content">
      <RaceList />
    </div>
  </div>
</template>

<script setup lang="ts">
// SEO metadata
definePageMeta({
  title: 'foal',
});

useSeoMeta({
  title: 'foal',
  description: 'next up; money.',
  ogTitle: 'foal',
  ogDescription: 'next up; money.',
});
</script>

<style scoped>
.racing-page {
  @apply flex flex-col gap-8 w-screen max-w-7xl;
  @apply px-6 sm:px-8 md:px-8 lg:px-8 py-6 sm:py-10;
}

.racing-page__hud {
  @apply w-full;
}

.racing-page__filters {
  @apply w-full;
}

.racing-page__content {
  @apply flex-1 w-full;
}
</style>
