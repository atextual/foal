<template>
  <div class="race-list">
    <!-- Loading State -->
    <RaceListSkeleton v-if="loading && races.length === 0" :count="5" />

    <!-- Error State -->
    <RaceListError v-else-if="error" :error="error" :loading="loading" @retry="retryFetch" />

    <!-- Empty State -->
    <RaceListEmpty
      v-else-if="displayRaces.length === 0"
      :message="
        hasActiveFilters
          ? 'Try adjusting your filters to see more races.'
          : 'No upcoming races available at the moment.'
      "
    >
      <template #action>
        <UButton v-if="hasActiveFilters" variant="outline" class="mt-4" @click="clearFilters">
          <UIcon name="i-tabler-filter-off" class="w-4 h-4 mr-2" />
          Clear Filters
        </UButton>
      </template>
    </RaceListEmpty>

    <!-- Race Cards -->
    <div v-else class="race-list__grid" :data-direction="paginationDirection">
      <TransitionGroup name="list" tag="div" class="race-grid" mode="out-in">
        <RaceCard
          v-for="race in displayRaces"
          :key="race.race_id"
          :race="race"
          :is-expiring="isRaceExpiring(race)"
          class="race-grid__item"
        />
      </TransitionGroup>
    </div>

    <!-- Refresh Indicator -->
    <div v-if="loading && races.length > 0" class="race-list__refresh">
      <UBadge color="blue" variant="soft">
        <UIcon name="i-tabler-refresh" class="animate-spin w-3 h-3 mr-1" />
        Updating races...
      </UBadge>
    </div>

    <!-- Pagination and Controls -->
    <RaceListPagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      v-model:fetch-limit="fetchLimit"
      :total-items="totalRaces"
      @update:fetch-limit="handleFetchLimitChange"
    />
  </div>
</template>

<script setup lang="ts">
import { watchDebounced, useIntervalFn } from '@vueuse/core';
import type { Race } from '@/types';
import { TIMING_SECONDS, PAGINATION, TIMING } from '@/utils/constants';

const racesStore = useRacesStore();
const filtersStore = useFiltersStore();

// Get store state
const { races, loading, error } = storeToRefs(racesStore);

// Computed races with pagination
const displayRaces = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return allFilteredRaces.value.slice(startIndex, endIndex);
});

// Check if a race is expiring (for animation)
const isRaceExpiring = (race: Race) => {
  return racesStore
    .getExpiringRaces()
    .some((expiringRace) => expiringRace.race_id === race.race_id);
};

// Actions
const retryFetch = async () => {
  await racesStore.refresh();
};

const clearFilters = () => {
  filtersStore.clearCategories();
};

const handleFetchLimitChange = (newLimit: number | { value: number }) => {
  // Extract the value if it's an object
  const limitValue = typeof newLimit === 'object' ? newLimit.value : newLimit;
  // Reset to first page
  currentPage.value = 1;
  // Update the store's fetch count (this will also refetch with replaceAll=true)
  racesStore.setFetchCount(Number(limitValue));
};

// Check if filters are active
const hasActiveFilters = computed(() => filtersStore.hasActiveFilters);

// Pagination - Brief requires exactly 5 races at all times
const currentPage = ref(1);
const pageSize = ref(PAGINATION.DEFAULT_PAGE_SIZE);
const fetchLimit = ref(PAGINATION.DEFAULT_FETCH_COUNT);
const paginationDirection = ref<'forward' | 'backward'>('forward');

// Get all filtered races (before pagination)
const allFilteredRaces = computed(() => {
  // Start with all races from store
  let availableRaces = [...racesStore.races];

  // Filter by time status - remove races after expiration threshold
  const now = Math.floor(Date.now() / 1000);
  availableRaces = availableRaces.filter((race) => {
    const timeSinceStart = now - race.advertised_start.seconds;

    // Keep races until expiration threshold after start time
    return timeSinceStart < TIMING_SECONDS.RACE_EXPIRE_THRESHOLD;
  });

  // Apply category filters if any are selected
  if (filtersStore.hasActiveFilters) {
    availableRaces = availableRaces.filter((race) =>
      filtersStore.selectedCategories.includes(race.category_id),
    );
  }

  // Sort by start time (ascending - next races first)
  availableRaces.sort((a, b) => a.advertised_start.seconds - b.advertised_start.seconds);

  return availableRaces;
});

const totalRaces = computed(() => allFilteredRaces.value.length);

// Modern auto-refresh with VueUse
const { pause: pauseAutoRefresh, resume: resumeAutoRefresh } = useIntervalFn(
  async () => {
    await racesStore.fetchRaces();
  },
  TIMING.DEFAULT_REFRESH_INTERVAL,
  { immediate: false },
);

// Debounced filter changes to avoid excessive re-renders
watchDebounced(
  [() => filtersStore.selectedCategories, () => filtersStore.showStarted],
  () => {
    currentPage.value = 1;
  },
  { debounce: 300, deep: true },
);

// Use watchEffect for reactive page adjustments
watchEffect(() => {
  const newTotalPages = Math.ceil(totalRaces.value / pageSize.value);
  if (currentPage.value > newTotalPages && newTotalPages > 0) {
    currentPage.value = newTotalPages;
  }
});

// Scroll to top and track direction when page changes
watch(currentPage, (newPage, oldPage) => {
  // Determine pagination direction
  if (oldPage !== undefined) {
    paginationDirection.value = newPage > oldPage ? 'forward' : 'backward';
  }

  nextTick(() => {
    // Find the actual scrollable element in the app
    const scrollableElement =
      document.querySelector('.app__container') ||
      document.querySelector('.app__main') ||
      document.documentElement;

    // Scroll the main container to top
    if (scrollableElement) {
      scrollableElement.scrollTop = 0;
    }

    // Also try standard methods as fallback
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
});

// Reset to first page when page size changes
watch(pageSize, () => {
  currentPage.value = 1;
});

// Lifecycle
onMounted(async () => {
  // Initialize fetch limit from store
  fetchLimit.value = racesStore.fetchCount;

  // Initial fetch
  await racesStore.fetchRaces();

  // Start auto-refresh using VueUse
  resumeAutoRefresh();

  // Start expiration manager
  racesStore.startExpirationManager();
});

onUnmounted(() => {
  pauseAutoRefresh();
});
</script>

<style scoped>
.race-list {
  @apply space-y-6;
}

/* Race Grid - with proper transition container */
.race-list__grid {
  @apply relative;
}

.race-grid {
  @apply grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5;
  display: grid;
  position: relative;
}

.race-grid__item {
  @apply w-full;
  grid-column: span 1;
}

/* Proper Vue TransitionGroup for grid - directional animations */
.list-enter-active {
  transition: all 0.3s ease;
}

/* Hide leaving cards immediately to prevent visible pulsing during transition */
.list-leave-active {
  opacity: 0 !important;
  transition: none !important;
  position: absolute;
  width: calc((100% - (var(--grid-gap) * (var(--grid-cols) - 1))) / var(--grid-cols));
}

/* Forward pagination - slide from right */
[data-direction='forward'] .list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

[data-direction='forward'] .list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Backward pagination - slide from left */
[data-direction='backward'] .list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

[data-direction='backward'] .list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.3s ease;
}

/* Grid variables for proper sizing */
@media (min-width: 1280px) {
  .race-grid {
    --grid-cols: 5;
    --grid-gap: 1.5rem;
  }
}

@media (min-width: 1024px) and (max-width: 1279px) {
  .race-grid {
    --grid-cols: 3;
    --grid-gap: 1.5rem;
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .race-grid {
    --grid-cols: 2;
    --grid-gap: 1rem;
  }
}

@media (max-width: 639px) {
  .race-grid {
    --grid-cols: 1;
    --grid-gap: 1rem;
  }
}

/* Refresh Indicator */
.race-list__refresh {
  @apply fixed bottom-6 right-6 z-50;
  @apply bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full px-4 py-2;
  @apply border border-gray-400/50 dark:border-gray-700/50 shadow-lg;
}

/* Smooth transitions */
.race-card-enter-active {
  @apply transition-all duration-500 ease-out;
}

.race-card-leave-active {
  @apply transition-all duration-300 ease-in;
}

.race-card-enter-from {
  @apply opacity-0 transform scale-90 translate-y-8;
}

.race-card-leave-to {
  @apply opacity-0 transform scale-95 translate-y-4;
}

.race-card-move {
  @apply transition-transform duration-300 ease-out;
}
</style>
