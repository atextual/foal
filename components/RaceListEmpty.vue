<template>
  <div class="race-list-empty">
    <div class="race-list-empty__card">
      <div class="race-list-empty__content">
        <UIcon name="i-tabler-calendar-off" class="race-list-empty__icon" />
        <h3 class="race-list-empty__title">{{ title }}</h3>
        <p class="race-list-empty__message">{{ message }}</p>
        <slot name="action" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  message?: string;
}

withDefaults(defineProps<Props>(), {
  title: 'No races found',
  message: 'No upcoming races available at the moment.',
});
</script>

<style scoped>
.race-list-empty {
  @apply flex justify-center col-span-full;
}

.race-list-empty__card {
  @apply max-w-md w-full rounded-2xl;
  @apply bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm;
  @apply border border-gray-200/50 dark:border-gray-600/60;
  @apply shadow-lg;
}

.race-list-empty__content {
  @apply text-center space-y-4 p-8;
}

.race-list-empty__icon {
  @apply w-12 h-12 text-gray-400 mx-auto;
}

.race-list-empty__title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.race-list-empty__message {
  @apply text-sm text-gray-600 dark:text-gray-300;
}
</style>
