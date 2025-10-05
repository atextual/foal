import { defineStore } from 'pinia';
import type { Race, RacesState } from '@/types';
import { TIMING_SECONDS, PAGINATION, TIMING } from '@/utils/constants';

export const useRacesStore = defineStore('races', {
  state: (): RacesState => ({
    races: [],
    loading: false,
    error: null,
    lastFetch: null,
    fetchCount: PAGINATION.DEFAULT_FETCH_COUNT,
    pagination: {
      currentPage: 1,
      itemsPerPage: PAGINATION.DEFAULT_PAGE_SIZE,
      totalItems: 0,
      totalPages: 0,
    },
  }),

  getters: {
    // Get races sorted by advertised start time (ascending)
    sortedRaces: (state): Race[] => {
      return [...state.races].sort((a, b) => {
        return a.advertised_start.seconds - b.advertised_start.seconds;
      });
    },

    // Get only races that haven't expired (within 1 minute of start time)
    activeRaces: (state): Race[] => {
      const now = Math.floor(Date.now() / 1000);

      return state.races.filter((race) => {
        const raceStartTime = race.advertised_start.seconds;
        const timeSinceStart = now - raceStartTime;

        // Keep races that haven't started or are within 1 minute of starting
        return timeSinceStart < TIMING_SECONDS.RACE_EXPIRE_THRESHOLD;
      });
    },

    // Get races for current page (sorted and filtered)
    displayRaces(): Race[] {
      const active = this.activeRaces;
      const sorted = [...active].sort((a, b) => {
        return a.advertised_start.seconds - b.advertised_start.seconds;
      });

      // Update pagination info
      this.pagination.totalItems = sorted.length;
      this.pagination.totalPages = Math.ceil(sorted.length / this.pagination.itemsPerPage);

      // Get races for current page
      const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
      const endIndex = startIndex + this.pagination.itemsPerPage;

      return sorted.slice(startIndex, endIndex);
    },

    // Check if we need more races
    needsMoreRaces(): boolean {
      return this.activeRaces.length < this.pagination.itemsPerPage;
    },

    // Available count options for dropdown
    countOptions(): number[] {
      return [5, 10, 15, 20, 25, 30];
    },
  },

  actions: {
    async fetchRaces(replaceAll = false) {
      this.loading = true;
      this.error = null;

      try {
        const { fetchRaces } = useRaceApi();
        const newRaces = await fetchRaces(this.fetchCount);

        if (replaceAll) {
          // Replace all races (used when fetch count changes)
          this.races = newRaces;
        } else {
          // Update races, removing duplicates by race_id
          const existingIds = new Set(this.races.map((r) => r.race_id));
          const uniqueNewRaces = newRaces.filter((race) => !existingIds.has(race.race_id));
          this.races = [...this.races, ...uniqueNewRaces];
        }

        this.lastFetch = new Date();

        // Clean up expired races
        this.removeExpiredRaces();
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch races';
        console.error('Store fetch error:', err);
      } finally {
        this.loading = false;
      }
    },

    removeExpiredRaces() {
      const now = Math.floor(Date.now() / 1000);
      const initialCount = this.races.length;

      this.races = this.races.filter((race) => {
        const raceStartTime = race.advertised_start.seconds;
        const timeSinceStart = now - raceStartTime;

        // Remove races after expiration threshold (as per brief)
        return timeSinceStart < TIMING_SECONDS.RACE_EXPIRE_THRESHOLD;
      });

      const removedCount = initialCount - this.races.length;
      if (removedCount > 0) {
        // If we have fewer than threshold upcoming races, fetch more
        if (this.races.length < PAGINATION.MIN_RACES_THRESHOLD) {
          this.fetchRaces();
        }
      }
    },

    updateRaceList(newRaces: Race[]) {
      // Replace entire race list with new data
      this.races = newRaces;
      this.removeExpiredRaces();
    },

    clearError() {
      this.error = null;
    },

    // Manual refresh action
    async refresh() {
      await this.fetchRaces();
    },

    // Get race by ID
    getRaceById(raceId: string): Race | undefined {
      return this.races.find((race) => race.race_id === raceId);
    },

    // Get races by category
    getRacesByCategory(categoryId: string): Race[] {
      return this.races.filter((race) => race.category_id === categoryId);
    },

    // Advanced expiration management
    startExpirationManager() {
      // Check for expired races at regular intervals
      setInterval(() => {
        this.removeExpiredRaces();
      }, TIMING.EXPIRATION_CHECK_INTERVAL);

      // More frequent checks when races are starting soon
      setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const hasStartingSoonRaces = this.races.some((race) => {
          const timeUntilStart = race.advertised_start.seconds - now;
          return (
            timeUntilStart > 0 && timeUntilStart <= TIMING_SECONDS.RACE_STARTING_SOON_THRESHOLD
          );
        });

        if (hasStartingSoonRaces) {
          this.removeExpiredRaces();
        }
      }, TIMING.FREQUENT_EXPIRATION_CHECK);
    },

    // Get races that are about to expire (for UI animations)
    getExpiringRaces(): Race[] {
      const now = Math.floor(Date.now() / 1000);
      const expirationWarningStart = TIMING_SECONDS.RACE_EXPIRE_THRESHOLD - 10; // 10 seconds before expiration

      return this.races.filter((race) => {
        const timeSinceStart = now - race.advertised_start.seconds;
        return (
          timeSinceStart > expirationWarningStart &&
          timeSinceStart < TIMING_SECONDS.RACE_EXPIRE_THRESHOLD
        );
      });
    },

    // Update fetch count
    setFetchCount(count: number) {
      this.fetchCount = count;
      // Reset to first page when changing count
      this.pagination.currentPage = 1;
      // Refetch with new count and replace all races
      this.fetchRaces(true);
    },

    // Update items per page
    setItemsPerPage(itemsPerPage: number) {
      this.pagination.itemsPerPage = itemsPerPage;
      this.pagination.currentPage = 1; // Reset to first page
    },

    // Navigate to specific page
    goToPage(page: number) {
      if (page >= 1 && page <= this.pagination.totalPages) {
        this.pagination.currentPage = page;
      }
    },

    // Navigate to next page
    nextPage() {
      if (this.pagination.currentPage < this.pagination.totalPages) {
        this.pagination.currentPage++;
      }
    },

    // Navigate to previous page
    previousPage() {
      if (this.pagination.currentPage > 1) {
        this.pagination.currentPage--;
      }
    },
  },
});
