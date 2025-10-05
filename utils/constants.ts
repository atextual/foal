// Timing constants (in milliseconds)
export const TIMING = {
  // Race timing
  RACE_EXPIRE_THRESHOLD: 60000, // 1 minute - when to remove race from display
  RACE_CRITICAL_THRESHOLD: 60000, // 1 minute - show critical warning
  RACE_STARTING_SOON_THRESHOLD: 300000, // 5 minutes - show starting soon warning

  // Refresh intervals
  DEFAULT_REFRESH_INTERVAL: 30000, // 30 seconds - default auto-refresh
  EXPIRATION_CHECK_INTERVAL: 10000, // 10 seconds - regular expiration check
  FREQUENT_EXPIRATION_CHECK: 5000, // 5 seconds - frequent check when races starting soon

  // UI update intervals
  COUNTDOWN_UPDATE_INTERVAL: 1000, // 1 second - countdown timer update

  // API retry
  RETRY_DELAY: 1000, // 1 second base delay for exponential backoff
} as const;

// Timing constants (in seconds) - for Unix timestamp comparisons
export const TIMING_SECONDS = {
  RACE_EXPIRE_THRESHOLD: 60, // 1 minute
  RACE_STARTING_SOON_THRESHOLD: 300, // 5 minutes
} as const;

// Refresh interval options (in milliseconds)
export const REFRESH_INTERVALS = {
  TEN_SECONDS: 10000,
  THIRTY_SECONDS: 30000,
  ONE_MINUTE: 60000,
  TWO_MINUTES: 120000,
} as const;

// Default pagination settings
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 5,
  DEFAULT_FETCH_COUNT: 80,
  MIN_RACES_THRESHOLD: 10, // Fetch more races when count drops below this
} as const;

// Race count options for display
export const RACE_COUNT_OPTIONS = {
  PAGE_SIZES: [5, 10, 15, 20],
  FETCH_LIMITS: [20, 50, 80, 100],
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  RACE_FILTERS: 'race-filters',
} as const;

// API configuration
export const API = {
  BASE_URL: 'https://api.neds.com.au/rest/v1/racing/',
  METHOD: 'nextraces',
  DEFAULT_COUNT: 10,
  MAX_RETRIES: 3,
} as const;

// Race categories - IDs from Neds API
export const CATEGORY_IDS = {
  GREYHOUND: '9daef0d7-bf3c-4f50-921d-8e818c60fe61',
  HARNESS: '161d9be2-e909-4326-8c2c-35ed71fb460b',
  HORSE: '4a2788f8-e825-4d36-9894-efd4baf1cfae',
} as const;

// Z-index layers for consistent layering
export const Z_INDEX = {
  BASE: 1,
  DROPDOWN: 10,
  STICKY: 20,
  FIXED: 30,
  MODAL_BACKDROP: 40,
  MODAL: 50,
  POPOVER: 60,
  TOOLTIP: 70,
} as const;
