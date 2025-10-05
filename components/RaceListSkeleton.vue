<template>
  <div class="race-list-skeleton">
    <div v-for="n in count" :key="n" class="race-list-skeleton__card">
      <div class="race-list-skeleton__indicator" />
      <div class="race-list-skeleton__content">
        <div class="race-list-skeleton__header">
          <div class="race-list-skeleton__line race-list-skeleton__line--title" />
          <div class="race-list-skeleton__line race-list-skeleton__line--subtitle" />
        </div>
        <div class="race-list-skeleton__timer">
          <div class="race-list-skeleton__line race-list-skeleton__line--timer" />
        </div>
        <div class="race-list-skeleton__details">
          <div class="race-list-skeleton__line race-list-skeleton__line--detail" />
          <div class="race-list-skeleton__line race-list-skeleton__line--detail" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  count?: number;
}

withDefaults(defineProps<Props>(), {
  count: 5,
});
</script>

<style scoped>
.race-list-skeleton {
  @apply grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5;
}

.race-list-skeleton__card {
  @apply relative overflow-hidden rounded-2xl;
  @apply bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm;
  @apply border border-gray-200/50 dark:border-gray-600/60;
  @apply min-h-[180px] p-5 animate-pulse;
}

.race-list-skeleton__indicator {
  @apply absolute top-3 left-3 w-8 h-8 rounded-full;
  @apply bg-gray-200 dark:bg-gray-700;
}

.race-list-skeleton__content {
  @apply ml-10 h-full flex flex-col justify-between;
}

.race-list-skeleton__header {
  @apply space-y-2;
}

.race-list-skeleton__timer {
  @apply flex justify-center py-4;
}

.race-list-skeleton__details {
  @apply space-y-2;
}

.race-list-skeleton__line {
  @apply bg-gray-200 dark:bg-gray-700 rounded-lg;
}

.race-list-skeleton__line--title {
  @apply h-4 w-3/4;
}

.race-list-skeleton__line--subtitle {
  @apply h-3 w-1/2;
}

.race-list-skeleton__line--timer {
  @apply h-8 w-20;
}

.race-list-skeleton__line--detail {
  @apply h-3 w-full;
}
</style>
