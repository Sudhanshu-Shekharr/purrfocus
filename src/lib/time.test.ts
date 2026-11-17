import { describe, it, expect } from 'vitest';
import { clamp, formatClock, getTimeOfDay } from './time';

describe('time utility', () => {
  describe('clamp', () => {
    it('returns the value when within bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('clamps to lower bound when value is below min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('clamps to upper bound when value is above max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('handles inverted min/max gracefully', () => {
      expect(clamp(5, 10, 0)).toBe(5);
      expect(clamp(-1, 10, 0)).toBe(0);
      expect(clamp(15, 10, 0)).toBe(10);
    });
  });

  describe('formatClock', () => {
    it('formats 0 seconds as 00:00', () => {
      expect(formatClock(0)).toBe('00:00');
    });

    it('formats seconds under one minute with padding', () => {
      expect(formatClock(5)).toBe('00:05');
      expect(formatClock(45)).toBe('00:45');
    });

    it('formats exact minutes', () => {
      expect(formatClock(60)).toBe('01:00');
      expect(formatClock(1500)).toBe('25:00');
    });

    it('formats minutes and seconds combined', () => {
      expect(formatClock(65)).toBe('01:05');
      expect(formatClock(305)).toBe('05:05');
      expect(formatClock(1523)).toBe('25:23');
    });

    it('floors fractional seconds', () => {
      expect(formatClock(59.9)).toBe('00:59');
      expect(formatClock(60.2)).toBe('01:00');
    });

    it('clamps negative numbers to 00:00', () => {
      expect(formatClock(-10)).toBe('00:00');
    });

    it('handles NaN gracefully', () => {
      expect(formatClock(NaN)).toBe('00:00');
    });
  });

  describe('getTimeOfDay', () => {
    function makeDate(hours: number, minutes: number = 0): Date {
      const d = new Date(2026, 0, 1, hours, minutes, 0, 0);
      return d;
    }

    it('returns lateNight for 22:00 to 04:59', () => {
      expect(getTimeOfDay(makeDate(22, 0))).toBe('lateNight');
      expect(getTimeOfDay(makeDate(23, 59))).toBe('lateNight');
      expect(getTimeOfDay(makeDate(0, 0))).toBe('lateNight');
      expect(getTimeOfDay(makeDate(4, 59))).toBe('lateNight');
    });

    it('returns morning for 05:00 to 11:59', () => {
      expect(getTimeOfDay(makeDate(5, 0))).toBe('morning');
      expect(getTimeOfDay(makeDate(8, 30))).toBe('morning');
      expect(getTimeOfDay(makeDate(11, 59))).toBe('morning');
    });

    it('returns afternoon for 12:00 to 16:59', () => {
      expect(getTimeOfDay(makeDate(12, 0))).toBe('afternoon');
      expect(getTimeOfDay(makeDate(14, 0))).toBe('afternoon');
      expect(getTimeOfDay(makeDate(16, 59))).toBe('afternoon');
    });

    it('returns evening for 17:00 to 21:59', () => {
      expect(getTimeOfDay(makeDate(17, 0))).toBe('evening');
      expect(getTimeOfDay(makeDate(19, 45))).toBe('evening');
      expect(getTimeOfDay(makeDate(21, 59))).toBe('evening');
    });
  });
});

