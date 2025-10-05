<template>
  <div class="race-list-pagination">
    <div class="race-list-pagination__info">
      <span class="text-sm text-gray-600 dark:text-gray-400">
        Showing {{ displayStart }}-{{ displayEnd }} of {{ totalItems }} races
      </span>
    </div>

    <div v-if="totalPages > 1" class="race-list-pagination__controls">
      <UPagination
        :model-value="currentPage"
        :page-count="pageSize"
        :total="totalItems"
        :ui="paginationUi"
        @update:model-value="$emit('update:currentPage', $event)"
      />
    </div>

    <div class="race-list-pagination__options">
      <div class="race-list-pagination__page-size">
        <label class="race-list-pagination__label">Per page:</label>
        <USelectMenu
          :model-value="pageSize"
          :options="pageSizeOptions"
          value-attribute="value"
          option-attribute="label"
          :ui="selectUi"
          class="race-list-pagination__select"
          @update:model-value="$emit('update:pageSize', $event)"
        />
      </div>

      <div class="race-list-pagination__fetch-limit">
        <label class="race-list-pagination__label">Load:</label>
        <USelectMenu
          :model-value="fetchLimit"
          :options="fetchLimitOptions"
          value-attribute="value"
          option-attribute="label"
          :ui="selectUi"
          class="race-list-pagination__select"
          @update:model-value="$emit('update:fetchLimit', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RACE_COUNT_OPTIONS } from '@/utils/constants';

interface Props {
  currentPage: number;
  pageSize: number;
  fetchLimit: number;
  totalItems: number;
}

const props = defineProps<Props>();

defineEmits<{
  'update:currentPage': [value: number];
  'update:pageSize': [value: number];
  'update:fetchLimit': [value: number];
}>();

// Computed values
const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize));

const displayStart = computed(() => {
  if (props.totalItems === 0) return 0;
  return (props.currentPage - 1) * props.pageSize + 1;
});

const displayEnd = computed(() => {
  const end = props.currentPage * props.pageSize;
  return Math.min(end, props.totalItems);
});

// Options
const pageSizeOptions = RACE_COUNT_OPTIONS.PAGE_SIZES.map((value) => ({
  label: String(value),
  value,
}));

const fetchLimitOptions = RACE_COUNT_OPTIONS.FETCH_LIMITS.map((value) => ({
  label: `${value} races`,
  value,
}));

// UI configs
const paginationUi = {
  wrapper: 'flex items-center gap-1',
  rounded: '!rounded-full min-w-[32px] justify-center',
  default: { size: 'sm' },
};

const selectUi = {
  rounded: 'rounded-lg',
  size: 'sm',
};
</script>

<style scoped>
.race-list-pagination {
  @apply flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-6;
  @apply mt-8 p-3 md:p-5;
  @apply bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl;
  @apply border border-gray-300 dark:border-gray-600/60;
  @apply shadow-lg shadow-gray-200/25 dark:shadow-gray-900/25;
}

.race-list-pagination__info {
  @apply flex-shrink-0 w-full lg:w-auto;
  @apply text-center lg:text-left order-1;
  @apply text-xs md:text-sm;
}

.race-list-pagination__controls {
  @apply flex-1 flex justify-center;
  @apply w-full lg:w-auto order-2;
  @apply my-1 lg:my-0;
}

.race-list-pagination__options {
  @apply flex flex-row items-center gap-4 lg:gap-6;
  @apply flex-shrink-0 w-full lg:w-auto;
  @apply justify-center lg:justify-end order-3;
}

.race-list-pagination__page-size,
.race-list-pagination__fetch-limit {
  @apply flex items-center gap-2;
  @apply w-auto;
  @apply justify-start;
}

.race-list-pagination__label {
  @apply text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300;
  @apply whitespace-nowrap;
}

.race-list-pagination__select {
  @apply flex-initial;
  @apply min-w-[70px] md:min-w-[80px];
  @apply max-w-[90px] md:max-w-[100px];
}
</style>
