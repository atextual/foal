<template>
  <div :class="cardClasses" class="race-card">
    <div class="race-card__content">
      <!-- Header -->
      <div class="race-card__header">
        <div class="race-card__header-left">
          <div class="race-card__meeting">
            {{ race.meeting_name }}
          </div>
          <div class="race-card__race-info">
            <span class="race-card__race-number">R{{ race.race_number }}</span>
            <span class="race-card__distance"
              >{{ race.race_form.distance }}{{ race.race_form.distance_type.short_name }}</span
            >
          </div>
        </div>

        <!-- Category indicator -->
        <div
          class="race-card__category-indicator"
          :class="`race-card__category-indicator--${categoryColor}`"
        />
      </div>

      <!-- Timer -->
      <div class="race-card__timer">
        <div class="race-card__countdown">
          {{ countdownDisplay }}
        </div>
        <div class="race-card__start-time">
          {{ formatStartTime }}
        </div>
      </div>

      <!-- Details -->
      <div class="race-card__details">
        <!-- Location and prize -->
        <div class="race-card__detail-row">
          <div class="race-card__venue">
            <UIcon name="i-tabler-map-pin" class="w-3 h-3 opacity-60" />
            <span>{{ race.venue_name }}, {{ race.venue_state }}</span>
          </div>
          <div v-if="prizeMoney" class="race-card__prize">
            <UIcon name="i-tabler-trophy" class="w-3 h-3 opacity-60" />
            <span>{{ prizeMoney }}</span>
          </div>
        </div>

        <!-- Conditions -->
        <div class="race-card__detail-row race-card__detail-row--conditions">
          <div v-if="trackCondition" class="race-card__condition">
            <UIcon
              :name="trackCondition.icon"
              class="w-3 h-3 opacity"
              :class="`text-${trackCondition.color}-500`"
            />
            <span>{{ trackCondition.label }}</span>
          </div>
          <div v-if="weatherInfo" class="race-card__weather">
            <UIcon
              :name="weatherInfo.icon"
              class="w-3 h-3 opacity"
              :class="`text-${weatherInfo.color}-500`"
            />
            <span>{{ weatherInfo.label }}</span>
          </div>
        </div>

        <!-- Race class -->
        <div v-if="raceClass !== 'Open'" class="race-card__class">
          <UIcon name="i-tabler-award" class="w-3 h-3 opacity" />
          <span>{{ raceClass }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RaceCardProps } from '@/types';
import { RACE_CATEGORIES } from '@/types';
import { getTrackCondition, getWeatherInfo, formatRaceClass, formatPrizeMoney } from '@/utils';
import { TIMING } from '@/utils/constants';

const props = withDefaults(defineProps<RaceCardProps>(), {
  isExpiring: false,
});

// Get category information
const category = computed(() =>
  Object.values(RACE_CATEGORIES).find((cat) => cat.id === props.race.category_id),
);

const categoryColor = computed(() => category.value?.color ?? 'gray');

// Convert race start time to Date object
const raceStartTime = computed(() => {
  return new Date(props.race.advertised_start.seconds * 1000);
});

// Format start time for display
const formatStartTime = computed(() => {
  return raceStartTime.value.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
});

// Countdown timer with performance optimization
const currentTime = ref(Date.now());
let intervalId: NodeJS.Timeout | null = null;

// Update time every second
onMounted(() => {
  intervalId = setInterval(() => {
    currentTime.value = Date.now();
  }, TIMING.COUNTDOWN_UPDATE_INTERVAL);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

// Countdown display
const countdownDisplay = computed(() => {
  const now = currentTime.value;
  const target = raceStartTime.value.getTime();
  const diff = target - now;

  if (diff <= 0) return 'Starting';

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
});

// Check if race is starting soon or expired
const isStartingSoon = computed(() => {
  const diff = raceStartTime.value.getTime() - currentTime.value;
  return diff > 0 && diff <= TIMING.RACE_STARTING_SOON_THRESHOLD;
});

const isCritical = computed(() => {
  const diff = raceStartTime.value.getTime() - currentTime.value;
  return diff > 0 && diff <= TIMING.RACE_CRITICAL_THRESHOLD;
});

const shouldRemove = computed(() => {
  const diff = currentTime.value - raceStartTime.value.getTime();
  return diff >= TIMING.RACE_EXPIRE_THRESHOLD;
});

// Dynamic card classes
const cardClasses = computed(() => ({
  'race-card--starting-soon': isStartingSoon.value,
  'race-card--critical': isCritical.value,
  'race-card--expiring': props.isExpiring || shouldRemove.value,
  [`race-card--${categoryColor.value}`]: true,
}));

// Enhanced metadata with safe defaults
const trackCondition = computed(() => {
  try {
    return getTrackCondition(props.race.race_form?.track_condition?.short_name);
  } catch (e) {
    return { label: 'Good', icon: 'i-tabler-sun', color: 'green' };
  }
});

const weatherInfo = computed(() => {
  try {
    return getWeatherInfo(props.race.race_form?.weather?.short_name);
  } catch (e) {
    return { label: 'Fine', icon: 'i-tabler-sun', color: 'yellow' };
  }
});

const raceClass = computed(() => formatRaceClass(props.race.race_comment));
const prizeMoney = computed(() => formatPrizeMoney(props.race.additional_data));
</script>

<style scoped>
/* Main card container */
.race-card {
  /* Base card styles */
  @apply relative overflow-hidden rounded-2xl backdrop-blur-sm;
  @apply bg-gray-100/90 dark:bg-gray-800/60;
  @apply border border-gray-300 dark:border-gray-600/60;
  @apply shadow-lg shadow-gray-200/25 dark:shadow-gray-900/25;

  /* Interactive styles */
  @apply min-h-[180px] sm:min-h-[180px] p-4 sm:p-5;
  @apply transition-all duration-300 ease-out cursor-pointer;

  /* Enhanced hover effects */
  @apply hover:shadow-xl hover:shadow-gray-200/25 dark:hover:shadow-gray-900/25;
  @apply hover:scale-[1.02] hover:-translate-y-1;
}

/* Content wrapper */
.race-card__content {
  @apply flex flex-col h-full justify-between;
}

/* Header section */
.race-card__header {
  @apply flex flex-row items-start justify-between gap-2;
}

.race-card__header-left {
  @apply flex-1 min-w-0 space-y-1;
}

.race-card__meeting {
  @apply text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight;
}

.race-card__race-info {
  @apply flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400;
}

.race-card__race-number {
  @apply font-mono font-bold bg-gray-100 dark:bg-gray-800;
  @apply px-2 py-0.5 rounded-md;
}

.race-card__distance {
  @apply font-medium;
}

/* Category indicator */
.race-card__category-indicator {
  @apply w-6 h-6 rounded-full flex items-center justify-center;
  @apply flex-shrink-0 text-white shadow-sm;
}

.race-card__category-indicator--emerald {
  @apply bg-emerald-500;
}

.race-card__category-indicator--blue {
  @apply bg-blue-500;
}

.race-card__category-indicator--purple {
  @apply bg-purple-500;
}

.race-card__category-indicator--gray {
  @apply bg-gray-500;
}

/* Timer section */
.race-card__timer {
  @apply flex flex-col items-center justify-center flex-1 py-4;
}

.race-card__countdown {
  @apply text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white;
  @apply font-mono tracking-tight;
}

.race-card__start-time {
  @apply text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium;
}

/* Details section */
.race-card__details {
  @apply space-y-2 text-xs text-gray-600 dark:text-gray-400 pt-2;
}

.race-card__detail-row {
  @apply flex items-center justify-between gap-2;
}

.race-card__detail-row--conditions {
  @apply w-full;
}

.race-card__venue,
.race-card__prize {
  @apply flex items-center gap-1.5 truncate;
}

.race-card__condition,
.race-card__weather {
  @apply flex items-center gap-1.5 flex-shrink-0;
}

.race-card__class {
  @apply flex items-center gap-1.5 justify-center;
  @apply bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md;
  @apply text-gray-700 dark:text-gray-300 font-medium;
}

/* Card state variations */
.race-card--starting-soon {
  @apply ring-2 ring-orange-300 dark:ring-orange-600/70;
  @apply bg-orange-100/70 dark:bg-orange-900/20;
  @apply shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30;
}

.race-card--critical {
  @apply ring-2 ring-red-300 dark:ring-red-600/70;
  @apply bg-red-100/70 dark:bg-red-900/20;
  @apply shadow-lg shadow-red-200/50 dark:shadow-red-900/30;
  @apply animate-pulse;
}

.race-card--expiring {
  @apply opacity-60 grayscale animate-pulse;
}

/* Category-specific hover effects */
.race-card--emerald:hover {
  @apply bg-emerald-50/50 dark:bg-emerald-900/10;
  @apply ring-1 ring-emerald-200 dark:ring-emerald-800/50;
}

.race-card--blue:hover {
  @apply bg-blue-50/50 dark:bg-blue-900/10;
  @apply ring-1 ring-blue-200 dark:ring-blue-800/50;
}

.race-card--purple:hover {
  @apply bg-purple-50/50 dark:bg-purple-900/10;
  @apply ring-1 ring-purple-200 dark:ring-purple-800/50;
}

.race-card--gray:hover {
  @apply bg-gray-50/50 dark:bg-gray-900/10;
  @apply ring-1 ring-gray-200 dark:ring-gray-800/50;
}
</style>
