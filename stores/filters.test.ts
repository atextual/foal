import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useFiltersStore } from './filters';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock as any;

describe('useFiltersStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorageMock.clear();
  });

  describe('initial state', () => {
    it('starts with no selected categories', () => {
      const store = useFiltersStore();
      expect(store.selectedCategories).toEqual([]);
    });

    it('starts with showExpired false', () => {
      const store = useFiltersStore();
      expect(store.showExpired).toBe(false);
    });

    it('starts with showStarted false', () => {
      const store = useFiltersStore();
      expect(store.showStarted).toBe(false);
    });
  });

  describe('availableCategories getter', () => {
    it('returns all race categories', () => {
      const store = useFiltersStore();
      const categories = store.availableCategories;

      expect(categories).toHaveLength(3);
      expect(categories.some((c) => c.name === 'Greyhound')).toBe(true);
      expect(categories.some((c) => c.name === 'Harness')).toBe(true);
      expect(categories.some((c) => c.name === 'Horse')).toBe(true);
    });
  });

  describe('hasActiveFilters getter', () => {
    it('returns false when no categories selected', () => {
      const store = useFiltersStore();
      expect(store.hasActiveFilters).toBe(false);
    });

    it('returns true when categories are selected', () => {
      const store = useFiltersStore();
      store.selectedCategories = ['9daef0d7-bf3c-4f50-921d-8e818c60fe61'];
      expect(store.hasActiveFilters).toBe(true);
    });
  });

  describe('isCategorySelected', () => {
    it('returns true for selected category', () => {
      const store = useFiltersStore();
      const categoryId = '9daef0d7-bf3c-4f50-921d-8e818c60fe61';
      store.selectedCategories = [categoryId];

      expect(store.isCategorySelected(categoryId)).toBe(true);
    });

    it('returns false for non-selected category', () => {
      const store = useFiltersStore();
      const categoryId = '9daef0d7-bf3c-4f50-921d-8e818c60fe61';

      expect(store.isCategorySelected(categoryId)).toBe(false);
    });
  });

  describe('selectCategory', () => {
    it('sets single category as selected', () => {
      const store = useFiltersStore();
      const categoryId = '9daef0d7-bf3c-4f50-921d-8e818c60fe61';

      store.selectCategory(categoryId);

      expect(store.selectedCategories).toEqual([categoryId]);
    });

    it('replaces previous selection (single-select behavior)', () => {
      const store = useFiltersStore();
      const categoryId1 = '9daef0d7-bf3c-4f50-921d-8e818c60fe61';
      const categoryId2 = '4a2788f8-e825-4d36-9894-efd4baf1cfae';

      store.selectCategory(categoryId1);
      store.selectCategory(categoryId2);

      expect(store.selectedCategories).toEqual([categoryId2]);
      expect(store.selectedCategories).toHaveLength(1);
    });
  });

  describe('toggleCategory', () => {
    it('adds category if not selected', () => {
      const store = useFiltersStore();
      const categoryId = '9daef0d7-bf3c-4f50-921d-8e818c60fe61';

      store.toggleCategory(categoryId);

      expect(store.selectedCategories).toContain(categoryId);
    });

    it('removes category if already selected', () => {
      const store = useFiltersStore();
      const categoryId = '9daef0d7-bf3c-4f50-921d-8e818c60fe61';
      store.selectedCategories = [categoryId];

      store.toggleCategory(categoryId);

      expect(store.selectedCategories).not.toContain(categoryId);
    });

    it('allows multiple categories (multi-select)', () => {
      const store = useFiltersStore();
      const categoryId1 = '9daef0d7-bf3c-4f50-921d-8e818c60fe61';
      const categoryId2 = '4a2788f8-e825-4d36-9894-efd4baf1cfae';

      store.toggleCategory(categoryId1);
      store.toggleCategory(categoryId2);

      expect(store.selectedCategories).toHaveLength(2);
      expect(store.selectedCategories).toContain(categoryId1);
      expect(store.selectedCategories).toContain(categoryId2);
    });
  });

  describe('clearCategories', () => {
    it('removes all selected categories', () => {
      const store = useFiltersStore();
      store.selectedCategories = [
        '9daef0d7-bf3c-4f50-921d-8e818c60fe61',
        '4a2788f8-e825-4d36-9894-efd4baf1cfae',
      ];

      store.clearCategories();

      expect(store.selectedCategories).toEqual([]);
    });
  });

  describe('selectAllCategories', () => {
    it('selects all available categories', () => {
      const store = useFiltersStore();

      store.selectAllCategories();

      expect(store.selectedCategories).toHaveLength(3);
    });
  });

  describe('selectedCount getter', () => {
    it('returns count of selected categories', () => {
      const store = useFiltersStore();
      store.selectedCategories = [
        '9daef0d7-bf3c-4f50-921d-8e818c60fe61',
        '4a2788f8-e825-4d36-9894-efd4baf1cfae',
      ];

      expect(store.selectedCount).toBe(2);
    });

    it('returns 0 when no categories selected', () => {
      const store = useFiltersStore();
      expect(store.selectedCount).toBe(0);
    });
  });

  describe('persistence', () => {
    it('persists filters to localStorage', () => {
      const store = useFiltersStore();
      store.selectedCategories = ['9daef0d7-bf3c-4f50-921d-8e818c60fe61'];
      store.showExpired = true;

      store.persistFilters();

      const stored = JSON.parse(localStorageMock.getItem('race-filters') || '{}');
      expect(stored.selectedCategories).toEqual(['9daef0d7-bf3c-4f50-921d-8e818c60fe61']);
      expect(stored.showExpired).toBe(true);
    });

    it('loads persisted filters from localStorage', () => {
      const categoryId = '9daef0d7-bf3c-4f50-921d-8e818c60fe61';

      // Set localStorage before creating store
      localStorageMock.setItem(
        'race-filters',
        JSON.stringify({
          selectedCategories: [categoryId],
          showExpired: true,
          showStarted: false,
        }),
      );

      const store = useFiltersStore();
      store.loadPersistedFilters();

      expect(store.selectedCategories).toEqual([categoryId]);
      expect(store.showExpired).toBe(true);
    });

    it('handles missing localStorage data gracefully', () => {
      const store = useFiltersStore();

      expect(() => store.loadPersistedFilters()).not.toThrow();
      expect(store.selectedCategories).toEqual([]);
    });

    it('handles corrupted localStorage data', () => {
      localStorageMock.setItem('race-filters', 'invalid json');

      const store = useFiltersStore();

      expect(() => store.loadPersistedFilters()).not.toThrow();
      expect(store.selectedCategories).toEqual([]);
    });
  });

  describe('resetFilters', () => {
    it('resets all filters to default state', () => {
      const store = useFiltersStore();
      store.selectedCategories = ['9daef0d7-bf3c-4f50-921d-8e818c60fe61'];
      store.showExpired = true;

      store.resetFilters();

      expect(store.selectedCategories).toEqual([]);
      expect(store.showExpired).toBe(false);
    });
  });

  describe('getCategoryById', () => {
    it('returns category by ID', () => {
      const store = useFiltersStore();
      const greyhoundId = '9daef0d7-bf3c-4f50-921d-8e818c60fe61';

      const category = store.getCategoryById(greyhoundId);

      expect(category).toBeDefined();
      expect(category?.name).toBe('Greyhound');
    });

    it('returns undefined for non-existent category', () => {
      const store = useFiltersStore();

      const category = store.getCategoryById('non-existent-id');

      expect(category).toBeUndefined();
    });
  });
});
