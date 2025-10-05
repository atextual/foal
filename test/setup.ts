import { vi } from 'vitest';

// Mock Nuxt auto-imports
global.defineNuxtComponent = vi.fn();
global.definePageMeta = vi.fn();
global.useRuntimeConfig = vi.fn(() => ({
  public: {
    apiBaseUrl: 'https://api.neds.com.au/rest/v1/racing/',
  },
}));

// Mock $fetch for tests
global.$fetch = vi.fn();

// Mock useRaceApi composable
global.useRaceApi = vi.fn(() => ({
  fetchRaces: vi.fn().mockResolvedValue({ races: [], categories: [] }),
}));

// Mock process.client for client-side checks and NODE_ENV
Object.defineProperty(global, 'process', {
  value: {
    client: true,
    server: false,
    env: {
      NODE_ENV: 'test',
    },
  },
  writable: true,
});

// Silence console.warn and console.error in tests to reduce noise
// They're still captured by vitest for debugging if needed
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
  };
}
