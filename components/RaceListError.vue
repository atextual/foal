<template>
  <div class="race-list-error">
    <div class="race-list-error__card">
      <div class="race-list-error__content">
        <UIcon name="i-tabler-alert-triangle" class="race-list-error__icon" />
        <h3 class="race-list-error__title">{{ title }}</h3>
        <p class="race-list-error__message">{{ error }}</p>
        <UButton
          v-if="showRetry"
          :loading="loading"
          variant="outline"
          class="race-list-error__button"
          @click="$emit('retry')"
        >
          <UIcon name="i-tabler-refresh" class="w-4 h-4 mr-2" />
          Try Again
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  error: string;
  loading?: boolean;
  showRetry?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: 'Unable to load races',
  loading: false,
  showRetry: true,
});

defineEmits<{
  retry: [];
}>();
</script>

<style scoped>
.race-list-error {
  @apply flex justify-center col-span-full;
}

.race-list-error__card {
  @apply max-w-md w-full rounded-2xl;
  @apply bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm;
  @apply border border-red-200/50 dark:border-red-700/70;
  @apply shadow-lg;
}

.race-list-error__content {
  @apply text-center space-y-4 p-8;
}

.race-list-error__icon {
  @apply w-12 h-12 text-red-500 mx-auto;
}

.race-list-error__title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.race-list-error__message {
  @apply text-sm text-gray-600 dark:text-gray-300;
}

.race-list-error__button {
  @apply mt-4;
}
</style>
