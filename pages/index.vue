<template>
  <div class="racing-page">
    <!-- Full page loader -->
    <div v-if="isInitialLoading" class="racing-page__loader">
      <UIcon name="i-tabler-loader-2" class="w-12 h-12 animate-spin text-blue-500" />
      <p class="text-gray-600 dark:text-gray-400 mt-4 text-sm">Loading races...</p>
    </div>

    <!-- Main content -->
    <div v-else class="racing-page__content-wrapper">
      <!-- HUD Display -->
      <div class="racing-page__hud">
        <RaceHUD :races="races" :loading="loading" />
      </div>

      <!-- Filters -->
      <div class="racing-page__filters">
        <CategoryFilter />
      </div>

      <!-- Race Cards -->
      <div class="racing-page__content">
        <RaceList :races="races" :loading="loading" />
      </div>
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

// Initial loading state
const racesStore = useRacesStore();
const { races, loading } = storeToRefs(racesStore);

const isMounted = ref(false);

// Show loader until mounted AND races are loaded
const isInitialLoading = computed(() => !isMounted.value || (loading.value && races.value.length === 0));

onMounted(async () => {
  await racesStore.fetchRaces();
  isMounted.value = true;
});
</script>

<style scoped>
.racing-page {
  @apply flex flex-col gap-8 w-screen max-w-7xl;
  @apply px-6 sm:px-8 md:px-8 lg:px-8 py-6 md:py-8;
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

.racing-page__loader {
  @apply flex flex-col items-center justify-center min-h-[60vh];
}

.racing-page__content-wrapper {
  @apply flex flex-col gap-8 w-full;
}
</style>
