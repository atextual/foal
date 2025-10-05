import { defineStore } from 'pinia';
import type { FiltersState, RaceCategory } from '@/types';
import { RACE_CATEGORIES } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

export const useFiltersStore = defineStore('filters', {
  state: (): FiltersState => ({
    selectedCategories: [],
    showExpired: false,
    showStarted: false,
  }),

  getters: {
    // Get all available categories as array
    availableCategories(): RaceCategory[] {
      return Object.values(RACE_CATEGORIES);
    },

    // Check if any categories are selected
    hasActiveFilters(): boolean {
      return this.selectedCategories.length > 0;
    },

    // Check if a specific category is selected
    isCategorySelected:
      (state) =>
      (categoryId: string): boolean => {
        return state.selectedCategories.includes(categoryId);
      },

    // Get selected category objects
    selectedCategoryObjects(): RaceCategory[] {
      return this.availableCategories.filter((category) =>
        this.selectedCategories.includes(category.id),
      );
    },

    // Get count of selected categories
    selectedCount(): number {
      return this.selectedCategories.length;
    },
  },

  actions: {
    // Toggle a category selection
    toggleCategory(categoryId: string) {
      const index = this.selectedCategories.indexOf(categoryId);

      if (index > -1) {
        // Remove category if already selected
        this.selectedCategories.splice(index, 1);
      } else {
        // Add category if not selected
        this.selectedCategories.push(categoryId);
      }

      // Persist to localStorage
      this.persistFilters();
    },

    // Select a specific category (and deselect others)
    selectCategory(categoryId: string) {
      this.selectedCategories = [categoryId];
      this.persistFilters();
    },

    // Select multiple categories
    selectCategories(categoryIds: string[]) {
      this.selectedCategories = [...categoryIds];
      this.persistFilters();
    },

    // Clear all category selections
    clearCategories() {
      this.selectedCategories = [];
      this.persistFilters();
    },

    // Select all categories
    selectAllCategories() {
      this.selectedCategories = this.availableCategories.map((cat) => cat.id);
      this.persistFilters();
    },

    // Toggle show expired races
    toggleShowExpired() {
      this.showExpired = !this.showExpired;
      this.persistFilters();
    },

    // Toggle show started races
    toggleShowStarted() {
      this.showStarted = !this.showStarted;
      this.persistFilters();
    },

    // Persist filters to localStorage
    persistFilters() {
      if (process.client) {
        try {
          const filtersData = {
            selectedCategories: this.selectedCategories,
            showExpired: this.showExpired,
            showStarted: this.showStarted,
          };
          localStorage.setItem(STORAGE_KEYS.RACE_FILTERS, JSON.stringify(filtersData));
        } catch (error) {
          console.warn('Failed to persist filters:', error);
        }
      }
    },

    // Load filters from localStorage
    loadPersistedFilters() {
      if (process.client) {
        try {
          const stored = localStorage.getItem(STORAGE_KEYS.RACE_FILTERS);
          if (stored) {
            const filtersData = JSON.parse(stored);
            this.selectedCategories = filtersData.selectedCategories || [];
            this.showExpired = filtersData.showExpired || false;
            this.showStarted = filtersData.showStarted || false;
          }
        } catch (error) {
          console.warn('Failed to load persisted filters:', error);
          // Reset to defaults on error
          this.selectedCategories = [];
          this.showExpired = false;
        }
      }
    },

    // Reset filters to default state
    resetFilters() {
      this.selectedCategories = [];
      this.showExpired = false;
      this.persistFilters();
    },

    // Get category by ID
    getCategoryById(categoryId: string): RaceCategory | undefined {
      return this.availableCategories.find((cat) => cat.id === categoryId);
    },
  },
});
