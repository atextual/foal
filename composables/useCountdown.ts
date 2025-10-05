import type { CountdownState } from '@/types';
import { TIMING } from '@/utils/constants';

export const useCountdown = (targetTime: Ref<Date> | Date) => {
  const targetRef = isRef(targetTime) ? targetTime : ref(targetTime);

  const countdown = ref<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    timeUntilStart: 0,
  });

  const updateCountdown = (): void => {
    const now = new Date().getTime();
    const target = targetRef.value.getTime();
    const difference = target - now;

    countdown.value.timeUntilStart = difference;

    if (difference <= 0) {
      // Race has started or passed
      countdown.value.isExpired = true;
      countdown.value.days = 0;
      countdown.value.hours = 0;
      countdown.value.minutes = 0;
      countdown.value.seconds = 0;
    } else {
      // Calculate time remaining
      countdown.value.isExpired = false;
      countdown.value.days = Math.floor(difference / (1000 * 60 * 60 * 24));
      countdown.value.hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      countdown.value.minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      countdown.value.seconds = Math.floor((difference % (1000 * 60)) / 1000);
    }
  };

  // Computed display values
  const displayValue = computed(() => {
    const { days, hours, minutes, seconds, isExpired } = countdown.value;

    if (isExpired) {
      const elapsed = Math.abs(countdown.value.timeUntilStart);
      const elapsedMinutes = Math.floor(elapsed / (1000 * 60));
      const elapsedSeconds = Math.floor((elapsed % (1000 * 60)) / 1000);

      if (elapsedMinutes > 0) {
        return `+${elapsedMinutes}m ${elapsedSeconds}s`;
      } else {
        return `+${elapsedSeconds}s`;
      }
    }

    // Format based on time remaining
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  });

  const compactDisplay = computed(() => {
    const { hours, minutes, seconds, isExpired } = countdown.value;

    if (isExpired) {
      const elapsed = Math.abs(countdown.value.timeUntilStart);
      const elapsedMinutes = Math.floor(elapsed / (1000 * 60));
      const elapsedSeconds = Math.floor((elapsed % (1000 * 60)) / 1000);
      return `+${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSeconds.toString().padStart(2, '0')}`;
    }

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  });

  const minimalDisplay = computed(() => {
    const { minutes, seconds, isExpired } = countdown.value;

    if (isExpired) {
      return 'Started';
    }

    if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  });

  // Status indicators
  const isStartingSoon = computed(() => {
    return (
      !countdown.value.isExpired &&
      countdown.value.timeUntilStart <= TIMING.RACE_STARTING_SOON_THRESHOLD
    );
  });

  const isCritical = computed(() => {
    return (
      !countdown.value.isExpired && countdown.value.timeUntilStart <= TIMING.RACE_CRITICAL_THRESHOLD
    );
  });

  const shouldRemove = computed(() => {
    return (
      countdown.value.isExpired &&
      Math.abs(countdown.value.timeUntilStart) > TIMING.RACE_EXPIRE_THRESHOLD
    );
  });

  // Format helpers
  const getFormattedDisplay = (format: 'full' | 'compact' | 'minimal' = 'full'): string => {
    switch (format) {
      case 'compact':
        return compactDisplay.value;
      case 'minimal':
        return minimalDisplay.value;
      default:
        return displayValue.value;
    }
  };

  // Live timer interval
  const timerInterval = ref<NodeJS.Timeout | null>(null);

  // Start live countdown
  const startTimer = (): void => {
    updateCountdown(); // Initial update
    timerInterval.value = setInterval(updateCountdown, TIMING.COUNTDOWN_UPDATE_INTERVAL);
  };

  // Stop timer
  const stopTimer = (): void => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
  };

  // Auto-start timer
  startTimer();

  // Cleanup on unmount
  onUnmounted(() => {
    stopTimer();
  });

  return {
    countdown: readonly(countdown),
    displayValue: readonly(displayValue),
    compactDisplay: readonly(compactDisplay),
    minimalDisplay: readonly(minimalDisplay),
    isStartingSoon: readonly(isStartingSoon),
    isCritical: readonly(isCritical),
    shouldRemove: readonly(shouldRemove),
    updateCountdown,
    getFormattedDisplay,
    startTimer,
    stopTimer,
  };
};
