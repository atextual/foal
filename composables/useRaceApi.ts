import type { ApiResponse, Race, ApiError } from '@/types';
import { API, TIMING } from '@/utils/constants';

export const useRaceApi = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetch = ref<Date | null>(null);
  const pollingInterval = ref<NodeJS.Timeout | null>(null);
  const isPolling = ref(false);

  const fetchRaces = async (count: number = API.DEFAULT_COUNT): Promise<Race[]> => {
    loading.value = true;
    error.value = null;

    try {
      type ResponseType = string | Record<string, unknown>;
      let response: ResponseType;
      const url = `${API.BASE_URL}?method=${API.METHOD}&count=${count}`;

      // Check if running in Tauri
      const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

      if (isTauri) {
        // Use Tauri's HTTP client to bypass CORS
        try {
          const { fetch: tauriFetch } = await import('@tauri-apps/api/http');
          const tauriResponse = await tauriFetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          response =
            typeof tauriResponse.data === 'string'
              ? tauriResponse.data
              : JSON.stringify(tauriResponse.data);
        } catch (importError) {
          console.error('Failed to load Tauri API, falling back to fetch:', importError);
          // Fallback to regular fetch if Tauri API not available
          response = await $fetch<ResponseType>(url, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }
      } else {
        // Use Nuxt server API route for web (handles CORS)
        response = await $fetch<ResponseType>(`/api/races?count=${count}`);
      }

      // Parse the JSON response if it's a string
      let apiData: ApiResponse;

      if (typeof response === 'string') {
        try {
          apiData = JSON.parse(response) as ApiResponse;
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          throw new Error('Invalid JSON response from API');
        }
      } else if (response && typeof response === 'object') {
        // If response is already an object
        if ('status' in response && 'data' in response) {
          apiData = response as ApiResponse;
        } else {
          // If response is just the data part
          apiData = {
            status: 200,
            data: response as ApiResponse['data'],
            message: 'Success',
          };
        }
      } else {
        throw new Error('Invalid response format from API');
      }

      // Validate response structure
      if (!apiData.data || !apiData.data.race_summaries || !apiData.data.next_to_go_ids) {
        console.error('Invalid API response structure:', apiData);
        throw new Error(
          `Invalid API response structure: missing ${!apiData.data ? 'data' : !apiData.data.race_summaries ? 'race_summaries' : 'next_to_go_ids'}`,
        );
      }

      // Convert race summaries to array using next_to_go_ids and validate required fields

      const races: Race[] = apiData.data.next_to_go_ids
        .map((raceId) => {
          const race = apiData.data.race_summaries[raceId];
          if (!race) {
            console.error(`Race data missing for ID: ${raceId}`);
            console.error('Available race IDs:', Object.keys(apiData.data.race_summaries));
            return null;
          }
          return race;
        })
        .filter((race): race is Race => {
          if (!race) return false;

          // Validate required fields exist in the actual API response
          const isValid =
            race.race_id &&
            race.meeting_name &&
            race.race_number !== undefined &&
            race.category_id &&
            race.advertised_start?.seconds;

          if (!isValid) {
            console.warn('Invalid race data:', {
              race_id: race.race_id,
              has_meeting_name: !!race.meeting_name,
              has_race_number: race.race_number !== undefined,
              has_category_id: !!race.category_id,
              has_advertised_start: !!race.advertised_start?.seconds,
            });
          }

          return isValid;
        })
        .map((race) => ({
          ...race,
          // Ensure advertised_start is properly formatted as number
          advertised_start: {
            seconds: Number(race.advertised_start.seconds),
          },
          // Ensure race_number is a number
          race_number: Number(race.race_number),
        }));

      if (races.length === 0) {
        console.warn('No valid races found after processing');
        throw new Error('No valid race data available');
      }

      lastFetch.value = new Date();
      return races;
    } catch (err) {
      const apiError = err as ApiError;
      error.value = apiError.message || 'Failed to fetch race data';

      // Log error for debugging
      console.error('Race API Error:', err);

      // Re-throw error to be handled by calling code
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const retryFetch = async (
    count: number = API.DEFAULT_COUNT,
    maxRetries: number = API.MAX_RETRIES,
    delay: number = TIMING.RETRY_DELAY,
  ): Promise<Race[]> => {
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        return await fetchRaces(count);
      } catch (err) {
        attempts++;

        if (attempts >= maxRetries) {
          throw err;
        }

        // Exponential backoff
        const backoffDelay = delay * Math.pow(2, attempts - 1);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }

    return [];
  };

  const startPolling = (intervalMs: number = TIMING.DEFAULT_REFRESH_INTERVAL): void => {
    if (isPolling.value) return;

    isPolling.value = true;

    // Initial fetch
    fetchRaces();

    // Setup polling interval
    pollingInterval.value = setInterval(async () => {
      try {
        await fetchRaces();
      } catch (err) {
        console.error('Polling error:', err);
        // Continue polling even if individual requests fail
      }
    }, intervalMs);
  };

  const stopPolling = (): void => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
    isPolling.value = false;
  };

  const restartPolling = (intervalMs: number = TIMING.DEFAULT_REFRESH_INTERVAL): void => {
    stopPolling();
    startPolling(intervalMs);
  };

  return {
    loading: readonly(loading),
    error: readonly(error),
    lastFetch: readonly(lastFetch),
    isPolling: readonly(isPolling),
    fetchRaces,
    retryFetch,
    startPolling,
    stopPolling,
    restartPolling,
  };
};
