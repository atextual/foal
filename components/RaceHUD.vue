<template>
  <div class="race-hud" :class="borderColorClass">
    <!-- Dynamic gradient background -->
    <div class="race-hud__background" :class="backgroundGradientClass" />

    <!-- Main HUD display -->
    <div class="race-hud__main">
      <!-- Next race display -->
      <div v-if="nextRace" class="race-hud__next-race">
        <!-- Top row with badge and controls -->
        <div class="race-hud__top-row">
          <div class="race-hud__next-race-badge" :class="badgeColorClass">
            <UIcon name="i-tabler-clock" class="w-3 h-3 sm:w-4 sm:h-4" />
            <span class="text-xs sm:text-sm">Next Race</span>
          </div>

          <!-- Status and actions -->
          <div class="race-hud__controls">
            <!-- Status indicator -->
            <div class="race-hud__status" :class="statusClasses">
              <div class="race-hud__status-dot" />
              <span class="race-hud__status-text">{{ statusText }}</span>
            </div>

            <!-- Action buttons -->
            <div class="race-hud__actions">
              <button
                :disabled="loading"
                class="race-hud__action race-hud__action--primary"
                :title="loading ? 'Refreshing...' : 'Refresh races'"
                @click="refreshRaces"
              >
                <UIcon
                  name="i-tabler-refresh"
                  class="w-3 h-3"
                  :class="{ 'animate-spin': loading }"
                />
              </button>
              <button
                class="race-hud__action"
                :class="{ 'race-hud__action--active': isAutoRefreshEnabled }"
                :title="isAutoRefreshEnabled ? 'Pause auto-refresh' : 'Enable auto-refresh'"
                @click="toggleAutoRefresh"
              >
                <UIcon
                  :name="isAutoRefreshEnabled ? 'i-tabler-player-pause' : 'i-tabler-player-play'"
                  class="w-3 h-3"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Interval selector -->
        <div class="race-hud__interval-row">
          <div class="race-hud__interval">
            <UIcon
              name="i-tabler-clock-hour-3"
              class="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0"
            />
            <span class="race-hud__interval-label">Refresh every</span>
            <USelectMenu
              v-model="refreshInterval"
              :options="refreshIntervalOptions"
              :ui="selectUi"
              class="race-hud__interval-select"
              @update:model-value="handleIntervalChange"
            >
              <template #label>
                <span class="text-xs">{{ currentIntervalLabel }}</span>
              </template>
            </USelectMenu>
          </div>
        </div>

        <!-- Center countdown -->
        <div class="race-hud__center">
          <div class="race-hud__countdown-display">
            <span class="race-hud__countdown-value">{{ nextRaceCountdown }}</span>
            <span class="race-hud__countdown-label">until start</span>
          </div>
        </div>

        <!-- Bottom row with details -->
        <div class="race-hud__bottom-row">
          <!-- Left: Meeting details -->
          <div class="race-hud__race-details">
            <!-- Category badge - shows above meeting name -->
            <div
              class="race-hud__category-badge"
              :class="`race-hud__category-badge--${nextRaceCategory?.color ?? 'gray'}`"
            >
              <span>{{ nextRaceCategoryName }}</span>
            </div>

            <div class="race-hud__meeting-name">
              {{ nextRace.meeting_name }}
            </div>
            <div class="race-hud__venue">{{ nextRace.venue_name }}, {{ nextRace.venue_state }}</div>
          </div>

          <!-- Right: Race info -->
          <div class="race-hud__race-meta-column">
            <div class="race-hud__race-info">
              <span class="race-hud__race-number">Race {{ nextRace.race_number }}</span>
              <span class="race-hud__distance"
                >{{ nextRace.race_form.distance
                }}{{ nextRace.race_form.distance_type.short_name }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIntervalFn, useNow } from '@vueuse/core';
import { RACE_CATEGORIES } from '@/types';
import { TIMING, TIMING_SECONDS, REFRESH_INTERVALS } from '@/utils/constants';

const racesStore = useRacesStore();
const filtersStore = useFiltersStore();
const { races, loading } = storeToRefs(racesStore);

// Auto-refresh state
const isAutoRefreshEnabled = ref(true);
const refreshInterval = ref(TIMING.DEFAULT_REFRESH_INTERVAL);

const refreshIntervalOptions = [
  { label: '10s', value: REFRESH_INTERVALS.TEN_SECONDS },
  { label: '30s', value: REFRESH_INTERVALS.THIRTY_SECONDS },
  { label: '1m', value: REFRESH_INTERVALS.ONE_MINUTE },
  { label: '2m', value: REFRESH_INTERVALS.TWO_MINUTES },
];

// Get human-readable label for current interval
const currentIntervalLabel = computed(() => {
  const option = refreshIntervalOptions.find((opt) => opt.value === refreshInterval.value);
  return option?.label ?? '30s';
});

const selectUi = {
  rounded: 'rounded-lg',
  size: 'sm',
};

// Computed stats
const nextRace = computed(() => {
  const now = Math.floor(Date.now() / 1000);
  let availableRaces = [...races.value];

  // Filter by time status (exclude expired races)
  availableRaces = availableRaces.filter((race) => {
    const timeSinceStart = now - race.advertised_start.seconds;
    return timeSinceStart < TIMING_SECONDS.RACE_EXPIRE_THRESHOLD; // Not expired
  });

  // Apply category filters if any are selected
  if (filtersStore.hasActiveFilters) {
    availableRaces = availableRaces.filter((race) =>
      filtersStore.selectedCategories.includes(race.category_id),
    );
  }

  // Return next upcoming race
  return availableRaces
    .filter((race) => race.advertised_start.seconds > now)
    .sort((a, b) => a.advertised_start.seconds - b.advertised_start.seconds)[0];
});

const nextRaceCountdown = computed(() => {
  if (!nextRace.value) return '--:--';

  // Use currentTime.value to trigger reactivity
  const now = Math.floor(currentTime.value / 1000);
  const timeUntilStart = nextRace.value.advertised_start.seconds - now;

  if (timeUntilStart <= 0) return 'Starting';

  const minutes = Math.floor(timeUntilStart / 60);
  const seconds = timeUntilStart % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
});

const nextRaceCategory = computed(() => {
  if (!nextRace.value) return null;
  return Object.values(RACE_CATEGORIES).find((cat) => cat.id === nextRace.value?.category_id);
});

const nextRaceCategoryName = computed(() => nextRaceCategory.value?.name ?? 'All Races');

// Badge color classes based on category
const badgeColorClass = computed(() => {
  const color = !filtersStore.hasActiveFilters ? 'gray' : (nextRaceCategory.value?.color ?? 'gray');
  return `race-hud__next-race-badge--${color}`;
});

// Background gradient class
const backgroundGradientClass = computed(() => {
  if (!filtersStore.hasActiveFilters) {
    return 'race-hud__background--neutral';
  }
  return `race-hud__background--${nextRaceCategory.value?.color ?? 'neutral'}`;
});

// Border color class based on category
const borderColorClass = computed(() => {
  const color = !filtersStore.hasActiveFilters
    ? 'neutral'
    : (nextRaceCategory.value?.color ?? 'neutral');
  return `race-hud--border-${color}`;
});

// Status
const statusText = computed(() => {
  if (loading.value) return 'Updating...';
  if (!isAutoRefreshEnabled.value) return 'Paused';
  return 'Live';
});

const statusClasses = computed(() => ({
  'race-hud__status--loading': loading.value,
  'race-hud__status--paused': !isAutoRefreshEnabled.value && !loading.value,
  'race-hud__status--live': isAutoRefreshEnabled.value && !loading.value,
}));

const currentTime = useNow({ interval: TIMING.COUNTDOWN_UPDATE_INTERVAL });

const { pause, resume, isActive } = useIntervalFn(
  async () => {
    if (isAutoRefreshEnabled.value) {
      await racesStore.fetchRaces();
    }
  },
  refreshInterval,
  { immediate: false },
);

// Actions
const refreshRaces = async (): Promise<void> => {
  await racesStore.refresh();
};

const toggleAutoRefresh = (): void => {
  isAutoRefreshEnabled.value = !isAutoRefreshEnabled.value;

  if (isAutoRefreshEnabled.value) {
    resume();
  } else {
    pause();
  }
};

const handleIntervalChange = (newInterval: number | { value: number }): void => {
  // Extract the value if it's an object
  const intervalValue = typeof newInterval === 'object' ? newInterval.value : newInterval;
  refreshInterval.value = Number(intervalValue);

  // Auto-restart with new interval if active
  if (isActive.value) {
    pause();
    setTimeout(() => resume(), 100);
  }
};

// Lifecycle
onMounted(() => {
  if (isAutoRefreshEnabled.value) {
    resume();
  }
});

onUnmounted(() => {
  pause();
});
</script>

<style scoped>
/* Main HUD container */
.race-hud {
  @apply relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl w-full mx-0;
  @apply border shadow-2xl shadow-gray-600/10 dark:shadow-black/20;
  @apply p-3 sm:p-4 md:p-6 lg:p-8;
}

/* Dynamic border colors */
.race-hud--border-neutral {
  @apply border-gray-300 dark:border-gray-600/60;
}

.race-hud--border-emerald {
  @apply border-emerald-300 dark:border-emerald-500/40;
}

.race-hud--border-blue {
  @apply border-blue-300 dark:border-blue-500/40;
}

.race-hud--border-purple {
  @apply border-purple-300 dark:border-purple-500/40;
}

/* Background layer */
.race-hud__background {
  @apply absolute inset-0 backdrop-blur-xl;
  @apply transition-all duration-500;
}

/* Gradient backgrounds */
.race-hud__background--neutral {
  @apply bg-gradient-to-br from-white to-gray-200/10 dark:from-gray-600/15 dark:to-gray-700/15;
}

.race-hud__background--emerald {
  @apply bg-gradient-to-br from-emerald-100/40 to-emerald-100/50 dark:from-emerald-500/15 dark:to-emerald-600/15;
}

.race-hud__background--blue {
  @apply bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/15 dark:to-blue-600/15;
}

.race-hud__background--purple {
  @apply bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-500/15 dark:to-purple-600/15;
}

/* Main display area */
.race-hud__main {
  @apply relative z-10;
}

/* Next race display */
.race-hud__next-race {
  @apply w-full space-y-4;
}

/* Top row with badge and controls */
.race-hud__top-row {
  @apply flex flex-row items-center justify-between gap-2 md:gap-3;
  @apply w-full;
}

.race-hud__next-race-badge {
  @apply flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full;
  @apply text-xs sm:text-sm font-medium flex-shrink-0;
  @apply transition-colors duration-500;
}

/* Dynamic badge colors matching category */
.race-hud__next-race-badge--emerald {
  @apply bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300;
}

.race-hud__next-race-badge--blue {
  @apply bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300;
}

.race-hud__next-race-badge--purple {
  @apply bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300;
}

.race-hud__next-race-badge--gray {
  @apply bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300;
}

/* Controls section */
.race-hud__controls {
  @apply flex items-center gap-2 md:gap-3 flex-shrink-0;
  @apply w-auto justify-end;
}

/* Interval row underneath buttons */
.race-hud__interval-row {
  @apply flex justify-end;
  @apply w-full;
}

.race-hud__category-badge {
  @apply flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full;
  @apply text-white text-xs sm:text-sm font-medium shadow-lg flex-shrink-0;
  @apply bg-gradient-to-r;
  @apply w-fit;
}

.race-hud__category-badge--emerald {
  @apply from-emerald-500 to-emerald-600;
}

.race-hud__category-badge--blue {
  @apply from-blue-500 to-blue-600;
}

.race-hud__category-badge--purple {
  @apply from-purple-500 to-purple-600;
}

.race-hud__category-badge--gray {
  @apply from-gray-500 to-gray-600;
}

/* Center content - countdown */
.race-hud__center {
  @apply flex items-center justify-center py-3 sm:py-4 md:py-6;
}

.race-hud__countdown-display {
  @apply text-center space-y-1;
}

.race-hud__countdown-value {
  @apply block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold;
  @apply text-gray-900 dark:text-white font-mono tracking-tight;
  @apply drop-shadow-sm;
}

.race-hud__countdown-label {
  @apply block text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wide;
  @apply mt-2 sm:mt-3;
}

/* Bottom row with details and badge */
.race-hud__bottom-row {
  @apply flex items-end justify-between gap-3 md:gap-4;
}

.race-hud__race-details {
  @apply flex flex-col gap-0 flex-1 min-w-0;
}

.race-hud__race-details > .race-hud__category-badge {
  @apply mb-3;
}

.race-hud__race-details > .race-hud__meeting-name {
  @apply mb-0.5;
}

.race-hud__race-meta-column {
  @apply flex flex-col items-end gap-2;
  @apply flex-shrink-0;
}

.race-hud__meeting-name {
  @apply text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white;
  @apply drop-shadow-sm truncate;
}

.race-hud__venue {
  @apply font-medium text-gray-700 dark:text-gray-300;
  @apply text-xs sm:text-sm;
}

.race-hud__race-info {
  @apply flex flex-wrap items-center gap-2 justify-end;
}

.race-hud__race-number {
  @apply px-2 sm:px-3 py-0.5 sm:py-1 rounded-full;
  @apply bg-gray-50/90 dark:bg-gray-950/90;
  @apply text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100;
  @apply border border-gray-300/80 dark:border-gray-700/80;
  @apply shadow-sm backdrop-blur-sm flex-shrink-0;
}

.race-hud__distance {
  @apply font-semibold text-gray-900 dark:text-gray-100;
  @apply bg-gray-50/90 dark:bg-gray-950/90;
  @apply px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md;
  @apply border border-gray-300/80 dark:border-gray-700/80;
  @apply shadow-sm inline-block;
  @apply text-xs sm:text-sm;
}

/* Status and actions group */
.race-hud__status-actions {
  @apply flex items-center gap-3 flex-shrink-0;
  @apply w-full md:w-auto justify-between md:justify-start;
}

/* Status indicator */
.race-hud__status {
  @apply flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg;
  @apply bg-white/60 dark:bg-gray-800/80 backdrop-blur-sm;
  @apply border border-gray-300 dark:border-gray-600/50;
}

.race-hud__status-dot {
  @apply w-1.5 h-1.5 rounded-full flex-shrink-0;
}

.race-hud__status--live .race-hud__status-dot {
  @apply bg-green-400;
}

.race-hud__status--loading .race-hud__status-dot {
  @apply bg-blue-400 animate-pulse;
}

.race-hud__status--paused .race-hud__status-dot {
  @apply bg-orange-400;
}

.race-hud__status-text {
  @apply text-xs font-medium text-gray-700 dark:text-gray-300;
  @apply uppercase tracking-wide;
}

/* Compact actions */
.race-hud__actions {
  @apply flex gap-1.5;
}

.race-hud__action {
  @apply w-8 h-8 rounded-lg flex items-center justify-center;
  @apply bg-white/60 dark:bg-gray-800/80 backdrop-blur-sm;
  @apply border border-gray-300 dark:border-gray-600/50;
  @apply text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100;
  @apply transition-all duration-200 cursor-pointer;
  @apply hover:scale-110 hover:bg-white/80 dark:hover:bg-gray-700/90 active:scale-95;
  @apply hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50;
  @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100;
}

.race-hud__action--primary {
  @apply bg-blue-500/90 hover:bg-blue-600 text-white border-blue-400/50;
  @apply shadow-sm hover:shadow-lg hover:shadow-blue-500/25;
}

.race-hud__action--active {
  @apply bg-green-500/90 hover:bg-green-600 text-white border-green-400/50;
  @apply shadow-sm hover:shadow-lg hover:shadow-green-500/25;
}

.race-hud__action--loading {
  @apply cursor-not-allowed;
}

/* Interval selector - compact, no background */
.race-hud__interval {
  @apply flex items-center gap-1.5 md:gap-2;
  @apply w-auto justify-end;
}

.race-hud__interval-label {
  @apply text-xs text-gray-600 dark:text-gray-400;
  @apply whitespace-nowrap;
}

.race-hud__interval-select {
  @apply min-w-[65px] md:min-w-[70px];
  @apply max-w-[80px] md:max-w-[100px];
}
</style>
