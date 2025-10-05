import { describe, it, expect } from 'vitest';
import {
  formatTime,
  formatDate,
  getTimeDifference,
  isRaceExpired,
  getRaceStatus,
  getTrackCondition,
  getWeatherInfo,
  formatRaceClass,
  formatPrizeMoney,
} from './index';

describe('Racing Utilities', () => {
  describe('formatTime', () => {
    it('formats time in 12-hour format', () => {
      const date = new Date('2024-01-01T14:30:00');
      const result = formatTime(date);
      expect(result).toMatch(/2:30/);
      expect(result.toLowerCase()).toContain('pm');
    });
  });

  describe('formatDate', () => {
    it('formats date with day and month', () => {
      const date = new Date('2024-01-15T12:00:00');
      const result = formatDate(date);
      expect(result).toContain('Jan');
      expect(result).toContain('15');
    });
  });

  describe('getTimeDifference', () => {
    it('calculates positive difference for future time', () => {
      const now = new Date('2024-01-01T12:00:00');
      const future = new Date('2024-01-01T12:05:00');
      expect(getTimeDifference(future, now)).toBe(5 * 60 * 1000); // 5 minutes in ms
    });

    it('calculates negative difference for past time', () => {
      const now = new Date('2024-01-01T12:00:00');
      const past = new Date('2024-01-01T11:55:00');
      expect(getTimeDifference(past, now)).toBe(-5 * 60 * 1000);
    });
  });

  describe('isRaceExpired', () => {
    it('returns false for races starting in the future', () => {
      const now = new Date('2024-01-01T12:00:00');
      const future = new Date('2024-01-01T12:05:00');
      expect(isRaceExpired(future, now)).toBe(false);
    });

    it('returns false for races just started (< 60s ago)', () => {
      const now = new Date('2024-01-01T12:00:00');
      const justStarted = new Date('2024-01-01T11:59:30'); // 30 seconds ago
      expect(isRaceExpired(justStarted, now)).toBe(false);
    });

    it('returns true for races > 60 seconds past start time', () => {
      const now = new Date('2024-01-01T12:00:00');
      const expired = new Date('2024-01-01T11:58:00'); // 2 minutes ago
      expect(isRaceExpired(expired, now)).toBe(true);
    });
  });

  describe('getRaceStatus', () => {
    const now = new Date('2024-01-01T12:00:00');

    it('returns "expired" for races > 60s past start', () => {
      const expired = new Date('2024-01-01T11:58:00');
      expect(getRaceStatus(expired, now)).toBe('expired');
    });

    it('returns "started" for races just past start but < 60s', () => {
      const justStarted = new Date('2024-01-01T11:59:30');
      expect(getRaceStatus(justStarted, now)).toBe('started');
    });

    it('returns "critical" for races < 60s from start', () => {
      const critical = new Date('2024-01-01T12:00:30');
      expect(getRaceStatus(critical, now)).toBe('critical');
    });

    it('returns "starting-soon" for races 1-5 minutes from start', () => {
      const startingSoon = new Date('2024-01-01T12:03:00');
      expect(getRaceStatus(startingSoon, now)).toBe('starting-soon');
    });

    it('returns "upcoming" for races > 5 minutes away', () => {
      const upcoming = new Date('2024-01-01T12:10:00');
      expect(getRaceStatus(upcoming, now)).toBe('upcoming');
    });
  });

  describe('getTrackCondition', () => {
    it('handles "good" condition', () => {
      const result = getTrackCondition('good');
      expect(result.label).toBe('Good');
      expect(result.color).toBe('green');
    });

    it('handles conditions with ratings like "Good (4)"', () => {
      const result = getTrackCondition('Good (4)');
      expect(result.label).toBe('Good (4)');
      expect(result.color).toBe('yellow');
    });

    it('handles "heavy" conditions', () => {
      const result = getTrackCondition('heavy8');
      expect(result.label).toBe('Heavy (8)');
      expect(result.color).toBe('red');
    });

    it('defaults to "good" for unknown conditions', () => {
      const result = getTrackCondition('unknown');
      expect(result.label).toBe('Good');
    });

    it('handles empty string', () => {
      const result = getTrackCondition('');
      expect(result.label).toBe('Good');
    });
  });

  describe('getWeatherInfo', () => {
    it('handles "fine" weather', () => {
      const result = getWeatherInfo('fine');
      expect(result.label).toBe('Fine');
      expect(result.icon).toBe('i-tabler-sun');
    });

    it('handles "rain" weather', () => {
      const result = getWeatherInfo('rain');
      expect(result.label).toBe('Rain');
      expect(result.color).toBe('blue');
    });

    it('strips parenthetical content like "Fine (1)"', () => {
      const result = getWeatherInfo('Fine (1)');
      expect(result.label).toBe('Fine');
    });

    it('defaults to "fine" for unknown weather', () => {
      const result = getWeatherInfo('unknown');
      expect(result.label).toBe('Fine');
    });
  });

  describe('formatRaceClass', () => {
    it('formats Maiden races', () => {
      expect(formatRaceClass('MDN race comment')).toBe('Maiden');
      expect(formatRaceClass('MAID race comment')).toBe('Maiden');
    });

    it('formats Class races', () => {
      expect(formatRaceClass('CL1 race')).toBe('Class 1');
      expect(formatRaceClass('CL3 race')).toBe('Class 3');
    });

    it('formats Group races', () => {
      expect(formatRaceClass('G1 championship')).toBe('Group 1');
      expect(formatRaceClass('G2 feature')).toBe('Group 2');
    });

    it('formats Listed races', () => {
      expect(formatRaceClass('LR feature')).toBe('Listed');
    });

    it('returns "Open" for unmatched patterns', () => {
      expect(formatRaceClass('Some other race')).toBe('Open');
      expect(formatRaceClass('')).toBe('Open');
    });
  });

  describe('formatPrizeMoney', () => {
    it('extracts and formats prize money from JSON data', () => {
      const data = JSON.stringify({
        revealed_race_info: {
          prizemonies: {
            total_value: 50000,
          },
        },
      });
      expect(formatPrizeMoney(data)).toBe('$50,000');
    });

    it('handles large prize pools', () => {
      const data = JSON.stringify({
        revealed_race_info: {
          prizemonies: {
            total_value: 1000000,
          },
        },
      });
      expect(formatPrizeMoney(data)).toBe('$1,000,000');
    });

    it('returns empty string for invalid JSON', () => {
      expect(formatPrizeMoney('invalid json')).toBe('');
    });

    it('returns empty string for missing prize data', () => {
      const data = JSON.stringify({ other_data: {} });
      expect(formatPrizeMoney(data)).toBe('');
    });

    it('returns empty string for empty input', () => {
      expect(formatPrizeMoney('')).toBe('');
    });
  });
});
