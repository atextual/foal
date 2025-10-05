import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRacesStore } from './races';
import type { Race } from '@/types';
import { TIMING_SECONDS } from '@/utils/constants';

describe('useRacesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const createMockRace = (overrides: Partial<Race> = {}): Race => ({
    race_id: 'test-race-1',
    race_name: 'Test Race',
    race_number: 1,
    meeting_id: 'test-meeting',
    meeting_name: 'Test Track',
    category_id: '9daef0d7-bf3c-4f50-921d-8e818c60fe61', // Greyhound
    advertised_start: {
      seconds: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
    },
    race_form: {
      distance: 500,
      distance_type: {
        id: 'metres',
        name: 'Metres',
        short_name: 'm',
      },
      distance_type_id: 'metres',
      track_condition: {
        id: 'good',
        name: 'Good',
        short_name: 'Good',
      },
      track_condition_id: 'good',
      weather: {
        id: 'fine',
        name: 'Fine',
        short_name: 'Fine',
        icon_uri: '',
      },
      weather_id: 'fine',
      race_comment: 'Test race comment',
      additional_data: '',
    },
    venue_id: 'test-venue',
    venue_name: 'Test Venue',
    venue_state: 'VIC',
    venue_country: 'AUS',
    generated: Date.now(),
    silk_base_url: '',
    race_comment_alternative: '',
    ...overrides,
  });

  describe('initial state', () => {
    it('initializes with empty races array', () => {
      const store = useRacesStore();
      expect(store.races).toEqual([]);
    });

    it('initializes with loading false', () => {
      const store = useRacesStore();
      expect(store.loading).toBe(false);
    });

    it('initializes with null error', () => {
      const store = useRacesStore();
      expect(store.error).toBe(null);
    });

    it('initializes with default pagination', () => {
      const store = useRacesStore();
      expect(store.pagination.currentPage).toBe(1);
      expect(store.pagination.itemsPerPage).toBe(5);
    });
  });

  describe('sortedRaces getter', () => {
    it('sorts races by advertised start time ascending', () => {
      const store = useRacesStore();
      const now = Math.floor(Date.now() / 1000);

      store.races = [
        createMockRace({
          race_id: '1',
          advertised_start: { seconds: now + 600 },
        }), // 10 min
        createMockRace({
          race_id: '2',
          advertised_start: { seconds: now + 120 },
        }), // 2 min
        createMockRace({
          race_id: '3',
          advertised_start: { seconds: now + 300 },
        }), // 5 min
      ];

      const sorted = store.sortedRaces;
      expect(sorted[0].race_id).toBe('2'); // Earliest first
      expect(sorted[1].race_id).toBe('3');
      expect(sorted[2].race_id).toBe('1');
    });
  });

  describe('activeRaces getter', () => {
    it('includes races not yet started', () => {
      const store = useRacesStore();
      const now = Math.floor(Date.now() / 1000);

      store.races = [
        createMockRace({ advertised_start: { seconds: now + 300 } }), // 5 min future
      ];

      expect(store.activeRaces).toHaveLength(1);
    });

    it('includes races that started < 60s ago', () => {
      const store = useRacesStore();
      const now = Math.floor(Date.now() / 1000);

      store.races = [
        createMockRace({ advertised_start: { seconds: now - 30 } }), // Started 30s ago
      ];

      expect(store.activeRaces).toHaveLength(1);
    });

    it('excludes races that started > 60s ago', () => {
      const store = useRacesStore();
      const now = Math.floor(Date.now() / 1000);

      store.races = [
        createMockRace({ advertised_start: { seconds: now - 120 } }), // Started 2min ago
      ];

      expect(store.activeRaces).toHaveLength(0);
    });

    it('filters mixed expired and active races correctly', () => {
      const store = useRacesStore();
      const now = Math.floor(Date.now() / 1000);

      store.races = [
        createMockRace({
          race_id: '1',
          advertised_start: { seconds: now + 300 },
        }), // Active
        createMockRace({
          race_id: '2',
          advertised_start: { seconds: now - 120 },
        }), // Expired
        createMockRace({
          race_id: '3',
          advertised_start: { seconds: now - 30 },
        }), // Active
        createMockRace({
          race_id: '4',
          advertised_start: { seconds: now - 180 },
        }), // Expired
      ];

      const active = store.activeRaces;
      expect(active).toHaveLength(2);
      expect(active.some((r) => r.race_id === '1')).toBe(true);
      expect(active.some((r) => r.race_id === '3')).toBe(true);
    });
  });

  describe('removeExpiredRaces', () => {
    it('removes races past expiration threshold', () => {
      const store = useRacesStore();
      const now = Math.floor(Date.now() / 1000);

      store.races = [
        createMockRace({
          race_id: '1',
          advertised_start: { seconds: now + 300 },
        }), // Future
        createMockRace({
          race_id: '2',
          advertised_start: { seconds: now - 120 },
        }), // Expired
      ];

      store.removeExpiredRaces();

      expect(store.races).toHaveLength(1);
      expect(store.races[0].race_id).toBe('1');
    });

    it('keeps races within expiration threshold', () => {
      const store = useRacesStore();
      const now = Math.floor(Date.now() / 1000);

      store.races = [
        createMockRace({ advertised_start: { seconds: now - 30 } }), // 30s ago - within threshold
      ];

      store.removeExpiredRaces();

      expect(store.races).toHaveLength(1);
    });
  });

  describe('getRaceById', () => {
    it('finds race by ID', () => {
      const store = useRacesStore();
      store.races = [createMockRace({ race_id: 'test-123' })];

      const found = store.getRaceById('test-123');
      expect(found).toBeDefined();
      expect(found?.race_id).toBe('test-123');
    });

    it('returns undefined for non-existent race', () => {
      const store = useRacesStore();
      store.races = [createMockRace({ race_id: 'test-123' })];

      const found = store.getRaceById('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('getRacesByCategory', () => {
    it('filters races by category ID', () => {
      const store = useRacesStore();
      const greyhoundId = '9daef0d7-bf3c-4f50-921d-8e818c60fe61';
      const horseId = '4a2788f8-e825-4d36-9894-efd4baf1cfae';

      store.races = [
        createMockRace({ race_id: '1', category_id: greyhoundId }),
        createMockRace({ race_id: '2', category_id: horseId }),
        createMockRace({ race_id: '3', category_id: greyhoundId }),
      ];

      const greyhoundRaces = store.getRacesByCategory(greyhoundId);
      expect(greyhoundRaces).toHaveLength(2);
      expect(greyhoundRaces.every((r) => r.category_id === greyhoundId)).toBe(true);
    });

    it('returns empty array for category with no races', () => {
      const store = useRacesStore();
      const harnessId = '161d9be2-e909-4326-8c2c-35ed71fb460b';

      store.races = [createMockRace({ category_id: '9daef0d7-bf3c-4f50-921d-8e818c60fe61' })];

      const harnessRaces = store.getRacesByCategory(harnessId);
      expect(harnessRaces).toHaveLength(0);
    });
  });

  describe('pagination', () => {
    it('updates current page', () => {
      const store = useRacesStore();

      // Set up valid pagination state
      store.pagination.totalPages = 5;
      store.goToPage(3);

      expect(store.pagination.currentPage).toBe(3);
    });

    it('does not go to invalid page (< 1)', () => {
      const store = useRacesStore();
      store.pagination.currentPage = 2;
      store.goToPage(0);
      expect(store.pagination.currentPage).toBe(2); // Unchanged
    });

    it('navigates to next page', () => {
      const store = useRacesStore();
      store.pagination.currentPage = 1;
      store.pagination.totalPages = 5;

      store.nextPage();
      expect(store.pagination.currentPage).toBe(2);
    });

    it('does not go past last page', () => {
      const store = useRacesStore();
      store.pagination.currentPage = 5;
      store.pagination.totalPages = 5;

      store.nextPage();
      expect(store.pagination.currentPage).toBe(5); // Unchanged
    });

    it('navigates to previous page', () => {
      const store = useRacesStore();
      store.pagination.currentPage = 3;

      store.previousPage();
      expect(store.pagination.currentPage).toBe(2);
    });

    it('does not go before first page', () => {
      const store = useRacesStore();
      store.pagination.currentPage = 1;

      store.previousPage();
      expect(store.pagination.currentPage).toBe(1); // Unchanged
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      const store = useRacesStore();
      store.error = 'Test error';

      store.clearError();
      expect(store.error).toBe(null);
    });
  });
});
