// Racing utility functions

/**
 * Format time for display
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Calculate time difference in milliseconds
 */
export const getTimeDifference = (targetTime: Date, currentTime: Date = new Date()): number => {
  return targetTime.getTime() - currentTime.getTime();
};

/**
 * Check if a race has expired (more than 1 minute past start)
 */
export const isRaceExpired = (raceStartTime: Date, currentTime: Date = new Date()): boolean => {
  const timeDiff = getTimeDifference(raceStartTime, currentTime);
  return timeDiff < -60000; // 1 minute in milliseconds
};

/**
 * Get race status based on start time
 */
export const getRaceStatus = (
  raceStartTime: Date,
  currentTime: Date = new Date(),
): 'upcoming' | 'starting-soon' | 'critical' | 'started' | 'expired' => {
  const timeDiff = getTimeDifference(raceStartTime, currentTime);

  if (timeDiff < -60000) return 'expired';
  if (timeDiff < 0) return 'started';
  if (timeDiff < 60000) return 'critical'; // Less than 1 minute
  if (timeDiff < 300000) return 'starting-soon'; // Less than 5 minutes
  return 'upcoming';
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Australian racing track condition mappings
export const TRACK_CONDITIONS = {
  // Horse Racing Conditions
  firm: {
    label: 'Firm',
    description: 'Ideal racing surface',
    icon: 'i-tabler-sun',
    color: 'green',
  },
  good: {
    label: 'Good',
    description: 'Excellent conditions',
    icon: 'i-tabler-sun',
    color: 'green',
  },
  good3: {
    label: 'Good (3)',
    description: 'Good with slight give',
    icon: 'i-tabler-sun-high',
    color: 'green',
  },
  good4: {
    label: 'Good (4)',
    description: 'Good with some give',
    icon: 'i-tabler-sun-high',
    color: 'yellow',
  },
  dead4: {
    label: 'Dead (4)',
    description: 'Even surface, some give',
    icon: 'i-tabler-cloud',
    color: 'yellow',
  },
  dead5: {
    label: 'Dead (5)',
    description: 'Even surface, more give',
    icon: 'i-tabler-cloud',
    color: 'yellow',
  },
  slow5: {
    label: 'Slow (5)',
    description: 'Holding surface',
    icon: 'i-tabler-cloud-rain',
    color: 'orange',
  },
  slow6: {
    label: 'Slow (6)',
    description: 'More holding',
    icon: 'i-tabler-cloud-rain',
    color: 'orange',
  },
  slow7: {
    label: 'Slow (7)',
    description: 'Quite holding',
    icon: 'i-tabler-cloud-rain',
    color: 'orange',
  },
  heavy8: {
    label: 'Heavy (8)',
    description: 'Soft and holding',
    icon: 'i-tabler-cloud-storm',
    color: 'red',
  },
  heavy9: {
    label: 'Heavy (9)',
    description: 'Very soft',
    icon: 'i-tabler-cloud-storm',
    color: 'red',
  },
  heavy10: {
    label: 'Heavy (10)',
    description: 'Extremely soft',
    icon: 'i-tabler-cloud-storm',
    color: 'red',
  },

  // Greyhound Racing Conditions
  fast: {
    label: 'Fast',
    description: 'Optimal greyhound track',
    icon: 'i-tabler-bolt',
    color: 'green',
  },
  slow: {
    label: 'Slow',
    description: 'Slower greyhound track',
    icon: 'i-tabler-cloud',
    color: 'yellow',
  },
} as const;

// Weather condition mappings
export const WEATHER_CONDITIONS = {
  fine: { label: 'Fine', icon: 'i-tabler-sun', color: 'yellow' },
  overcast: { label: 'Overcast', icon: 'i-tabler-cloud', color: 'gray' },
  shwry: { label: 'Showery', icon: 'i-tabler-cloud-rain', color: 'blue' },
  rain: { label: 'Rain', icon: 'i-tabler-cloud-storm', color: 'blue' },
  storm: { label: 'Storm', icon: 'i-tabler-cloud-bolt', color: 'purple' },
} as const;

/**
 * Get track condition info with proper Australian racing terminology
 */
export const getTrackCondition = (condition?: string | null) => {
  if (!condition) return TRACK_CONDITIONS.good;

  // Normalize: "Good (4)" → "good4", "Dead (5)" → "dead5", etc.
  const normalized = condition
    .toLowerCase()
    .replace(/\s*\((\d+)\)/, '$1') // Remove space and parens: "good (4)" → "good4"
    .trim();

  return TRACK_CONDITIONS[normalized as keyof typeof TRACK_CONDITIONS] || TRACK_CONDITIONS.good;
};

/**
 * Get weather info
 * Strips out any parenthetical numbers (e.g., "Fine (1)" → "fine")
 */
export const getWeatherInfo = (weather?: string | null) => {
  if (!weather) return WEATHER_CONDITIONS.fine;

  // Normalize: remove any parenthetical content and trim
  const normalized = weather
    .toLowerCase()
    .replace(/\s*\([^)]*\)/, '') // Remove anything in parentheses
    .trim();

  return (
    WEATHER_CONDITIONS[normalized as keyof typeof WEATHER_CONDITIONS] || WEATHER_CONDITIONS.fine
  );
};

/**
 * Format race class/grade from race comment or additional data
 */
export const formatRaceClass = (raceComment?: string | null): string => {
  // Extract class from race comment
  const classMatches = raceComment?.match(/\b(MDN|MAID|CL[1-6]|G[1-3]|LR|BM\d+)\b/i);
  if (classMatches) {
    const raceClass = classMatches[0].toUpperCase();
    const classMap: Record<string, string> = {
      MDN: 'Maiden',
      MAID: 'Maiden',
      CL1: 'Class 1',
      CL2: 'Class 2',
      CL3: 'Class 3',
      CL4: 'Class 4',
      CL5: 'Class 5',
      CL6: 'Class 6',
      G1: 'Group 1',
      G2: 'Group 2',
      G3: 'Group 3',
      LR: 'Listed',
    };
    return classMap[raceClass] || raceClass;
  }
  return 'Open';
};

/**
 * Format prize money from additional data
 */
export const formatPrizeMoney = (additionalData?: string | null): string => {
  if (!additionalData) return '';
  try {
    const data = JSON.parse(additionalData);
    const totalValue = data?.revealed_race_info?.prizemonies?.total_value;
    if (totalValue) {
      return `$${totalValue.toLocaleString()}`;
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return '';
};

/**
 * Get race surface type
 */
export const getRaceSurface = (additionalData?: string | null): string => {
  if (!additionalData) return 'Turf';
  try {
    const data = JSON.parse(additionalData);
    const surface = data?.revealed_race_info?.track_surface;
    if (surface) {
      const surfaceMap: Record<string, string> = {
        Turf: 'Grass',
        'All Weather': 'Synthetic',
        Dirt: 'Dirt',
      };
      return surfaceMap[surface] || surface;
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return 'Turf';
};
