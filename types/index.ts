// Core race interfaces based on actual Neds API response structure
import { CATEGORY_IDS } from '@/utils/constants';

export interface Race {
  race_id: string;
  race_name: string;
  race_number: number;
  meeting_id: string;
  meeting_name: string;
  category_id: string;
  advertised_start: {
    seconds: number; // Unix timestamp
  };
  race_form: {
    distance: number;
    distance_type: {
      id: string;
      name: string;
      short_name: string;
    };
    distance_type_id: string;
    track_condition: {
      id: string;
      name: string;
      short_name: string;
    };
    track_condition_id: string;
    weather: {
      id: string;
      name: string;
      short_name: string;
      icon_uri: string;
    };
    weather_id: string;
    race_comment: string;
    additional_data: string;
  };
  venue_id: string;
  venue_name: string;
  venue_state: string;
  venue_country: string;
  generated: number;
  silk_base_url: string;
  race_comment_alternative: string;
}

// API response structure
export interface ApiResponse {
  status: number;
  data: {
    race_summaries: Record<string, Race>;
    next_to_go_ids: string[];
  };
  message: string;
}

// Pagination and filtering options
export interface RaceQueryOptions {
  count: number;
  method: 'nextraces';
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

// Race category definitions
export interface RaceCategory {
  id: string;
  name: string;
  color: string;
}

// Category constants - icons removed for consistency
export const RACE_CATEGORIES = {
  GREYHOUND: {
    id: CATEGORY_IDS.GREYHOUND,
    name: 'Greyhound',
    color: 'emerald',
  },
  HARNESS: {
    id: CATEGORY_IDS.HARNESS,
    name: 'Harness',
    color: 'blue',
  },
  HORSE: {
    id: CATEGORY_IDS.HORSE,
    name: 'Horse',
    color: 'purple',
  },
} as const;

export type CategoryId = keyof typeof RACE_CATEGORIES;

// State management interfaces
export interface RacesState {
  races: Race[];
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
  fetchCount: number;
  pagination: PaginationState;
}

export interface FiltersState {
  selectedCategories: string[];
  showExpired: boolean;
  showStarted: boolean;
}

// Countdown timer interfaces
export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  timeUntilStart: number; // milliseconds
}

// Component prop interfaces
export interface RaceCardProps {
  race: Race;
  isExpiring?: boolean;
}

export interface CategoryFilterProps {
  selectedCategories: string[];
  availableCategories: RaceCategory[];
}

export interface CountdownTimerProps {
  targetTime: Date;
  format?: 'full' | 'compact' | 'minimal';
}

// API error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
