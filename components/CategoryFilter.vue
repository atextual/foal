<template>
  <div class="category-filter">
    <!-- Filter title -->
    <h2 class="category-filter__title">Filter by</h2>

    <!-- Compact horizontal filter buttons -->
    <div class="category-filter__buttons">
      <div class="category-filter__buttons-group">
        <button
          v-for="category in availableCategories"
          :key="category.id"
          :class="getButtonClasses(category)"
          class="category-filter__button"
          @click="selectCategory(category.id)"
        >
          <div class="category-filter__button-dot" :class="getDotClasses(category)"></div>
          <span class="category-filter__button-name">{{ category.name }}</span>
          <span class="category-filter__button-count">{{ getCategoryCount(category.id) }}</span>
        </button>
      </div>

      <!-- Clear filter option -->
      <button
        v-if="filtersStore.hasActiveFilters"
        class="category-filter__clear-button"
        @click="clearFilters"
      >
        <div class="category-filter__clear-icon">
          <UIcon name="i-tabler-x" class="w-4 h-4" />
        </div>
        <span class="category-filter__button-name">Clear</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const filtersStore = useFiltersStore();
const racesStore = useRacesStore();

// Get filter state
const { availableCategories } = storeToRefs(filtersStore);

// Get the isCategorySelected function directly from the store
const isCategorySelected = (categoryId: string) => filtersStore.isCategorySelected(categoryId);

// Get count of races for each category
const getCategoryCount = (categoryId: string) => {
  return racesStore.activeRaces.filter((race) => race.category_id === categoryId).length;
};

// Button classes for single-select
const getButtonClasses = (category: any) => ({
  'category-filter__button--selected': isCategorySelected(category.id),
  [`category-filter__button--${category.color}`]: true,
});

// Actions - single select
const selectCategory = (categoryId: string) => {
  filtersStore.selectCategory(categoryId);
};

const clearFilters = () => {
  filtersStore.clearCategories();
};

const getDotClasses = (category: any) => ({
  [`category-filter__button-dot--${category.color}`]: true,
});

// Load persisted filters on mount - start with no filters
onMounted(() => {
  filtersStore.loadPersistedFilters();

  // Start with no filters selected (show all races)
  // User can select specific categories if they want to filter
});
</script>

<style scoped>
/* Main container - compact horizontal layout */
.category-filter {
  @apply bg-gray-100/70 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl;
  @apply border border-gray-300 dark:border-gray-700/50 p-4;
  @apply shadow-lg shadow-gray-200/25 dark:shadow-gray-900/25;
  @apply space-y-3;
}

/* Filter title */
.category-filter__title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

/* Filter buttons - horizontal layout */
.category-filter__buttons {
  @apply flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-wrap;
}

.category-filter__buttons-group {
  @apply flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap;
}

.category-filter__button {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg;
  @apply bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50;
  @apply border border-gray-300 dark:border-gray-700/50;
  @apply transition-all duration-200 ease-out cursor-pointer;
  @apply hover:shadow-md hover:shadow-gray-200/25 dark:hover:shadow-gray-900/25;
  @apply hover:scale-105 active:scale-95;
  @apply w-full sm:w-auto justify-start;
}

.category-filter__button--selected {
  @apply bg-white dark:bg-gray-800 shadow-md ring-2;
}

.category-filter__button--selected.category-filter__button--emerald {
  @apply ring-emerald-200 dark:ring-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20;
}

.category-filter__button--selected.category-filter__button--blue {
  @apply ring-blue-200 dark:ring-blue-800/50 bg-blue-50 dark:bg-blue-900/20;
}

.category-filter__button--selected.category-filter__button--purple {
  @apply ring-purple-200 dark:ring-purple-800/50 bg-purple-50 dark:bg-purple-900/20;
}

.category-filter__button--selected.category-filter__button--gray {
  @apply ring-gray-200 dark:ring-gray-800/50 bg-gray-50 dark:bg-gray-900/20;
}

.category-filter__button--selected.category-filter__button--orange {
  @apply ring-orange-200 dark:ring-orange-800/50 bg-orange-50 dark:bg-orange-900/20;
}

/* Button dot - color indicator */
.category-filter__button-dot {
  @apply w-3 h-3 rounded-full flex-shrink-0;
}

.category-filter__button-dot--emerald {
  @apply bg-emerald-500;
}

.category-filter__button-dot--blue {
  @apply bg-blue-500;
}

.category-filter__button-dot--purple {
  @apply bg-purple-500;
}

.category-filter__button-dot--gray {
  @apply bg-gray-500;
}

.category-filter__button-dot--orange {
  @apply bg-orange-500;
}

/* Clear button */
.category-filter__clear-button {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg;
  @apply bg-red-50/50 dark:bg-red-900/20 hover:bg-red-100/50 dark:hover:bg-red-900/30;
  @apply border border-red-200 dark:border-red-700/50;
  @apply transition-all duration-200 ease-out cursor-pointer;
  @apply hover:shadow-md hover:shadow-red-200/25 dark:hover:shadow-red-900/25;
  @apply hover:scale-105 active:scale-95;
}

.category-filter__clear-icon {
  @apply w-6 h-6 rounded-full flex items-center justify-center;
  @apply bg-red-500 text-white shadow-sm flex-shrink-0;
}

/* Button text */
.category-filter__button-name {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.category-filter__button-count {
  @apply text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700;
  @apply px-2 py-0.5 rounded-full font-medium;
}
</style>
