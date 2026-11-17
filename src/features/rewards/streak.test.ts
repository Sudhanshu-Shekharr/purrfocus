import { describe, it, expect } from 'vitest';
import { calculateStreak, diffCalendarDays, shiftDate } from './streak';

describe('Streak Calculation', () => {
  const TODAY = '2026-10-29';
  const YESTERDAY = '2026-10-28';
  const TWO_DAYS_AGO = '2026-10-27';
  const THREE_DAYS_AGO = '2026-10-26';

  describe('diffCalendarDays & shiftDate', () => {
    it('accurately calculates calendar day differences', () => {
      expect(diffCalendarDays(TODAY, TODAY)).toBe(0);
      expect(diffCalendarDays(TODAY, YESTERDAY)).toBe(1);
      expect(diffCalendarDays(TODAY, TWO_DAYS_AGO)).toBe(2);
      expect(diffCalendarDays('2026-03-01', '2026-02-28')).toBe(1); // non-leap year
    });

    it('correctly shifts dates by offsets', () => {
      expect(shiftDate(TODAY, -1)).toBe(YESTERDAY);
      expect(shiftDate(TODAY, -2)).toBe(TWO_DAYS_AGO);
      expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28');
    });
  });

  describe('calculateStreak', () => {
    it('returns 0 streak when there are no logs', () => {
      const res = calculateStreak([], TODAY);
      expect(res.current).toBe(0);
      expect(res.lastActiveDay).toBeNull();
      expect(res.gapDays).toBe(Infinity);
    });

    it('returns streak of 1 for a single session completed today', () => {
      const res = calculateStreak([TODAY], TODAY);
      expect(res.current).toBe(1);
      expect(res.lastActiveDay).toBe(TODAY);
      expect(res.gapDays).toBe(0);
    });

    it('grace period: preserves streak of 1 if active yesterday and none yet today', () => {
      const res = calculateStreak([YESTERDAY], TODAY);
      expect(res.current).toBe(1);
      expect(res.lastActiveDay).toBe(YESTERDAY);
      expect(res.gapDays).toBe(1);
    });

    it('calculates consecutive multi-day streak ending today', () => {
      const dates = [THREE_DAYS_AGO, TWO_DAYS_AGO, YESTERDAY, TODAY];
      const res = calculateStreak(dates, TODAY);
      expect(res.current).toBe(4);
      expect(res.lastActiveDay).toBe(TODAY);
      expect(res.gapDays).toBe(0);
    });

    it('grace period: calculates multi-day streak ending yesterday', () => {
      const dates = [THREE_DAYS_AGO, TWO_DAYS_AGO, YESTERDAY];
      const res = calculateStreak(dates, TODAY);
      expect(res.current).toBe(3);
      expect(res.lastActiveDay).toBe(YESTERDAY);
      expect(res.gapDays).toBe(1);
    });

    it('resets current streak to 0 if last active was 2 or more days ago', () => {
      const dates = [THREE_DAYS_AGO, TWO_DAYS_AGO]; // 2 days ago was last
      const res = calculateStreak(dates, TODAY);
      expect(res.current).toBe(0);
      expect(res.lastActiveDay).toBe(TWO_DAYS_AGO);
      expect(res.gapDays).toBe(2);
    });

    it('handles multiple sessions on the same day cleanly without inflating count', () => {
      const dates = [TODAY, TODAY, TODAY, YESTERDAY, YESTERDAY];
      const res = calculateStreak(dates, TODAY);
      expect(res.current).toBe(2);
      expect(res.lastActiveDay).toBe(TODAY);
      expect(res.gapDays).toBe(0);
    });

    it('ignores non-date formatted strings safely', () => {
      const dates = ['invalid', TODAY, ''];
      const res = calculateStreak(dates, TODAY);
      expect(res.current).toBe(1);
    });
  });
});
