import { describe, it, expect } from 'vitest';
import { pickLineWithWindow, getTimeOfDayGreetingContext } from './pickLine';

describe('Thought Bubble Line Picker & Time of Day Greeting', () => {
  const pool = ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6', 'Line 7', 'Line 8'];

  it('never returns any of the last 5 recent lines when alternatives exist', () => {
    let recent: string[] = ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5'];

    for (let i = 0; i < 20; i++) {
      const { line, updatedRecent } = pickLineWithWindow(pool, recent, () => 0);
      // The chosen line should NOT be in the input recent window
      expect(recent.includes(line)).toBe(false);
      expect(updatedRecent).toHaveLength(5);
      expect(updatedRecent[updatedRecent.length - 1]).toBe(line);
      recent = updatedRecent;
    }
  });

  it('falls back gracefully when all pool lines are already in the recent window', () => {
    const smallPool = ['Alpha', 'Bravo'];
    const recent = ['Alpha', 'Bravo'];

    const { line, updatedRecent } = pickLineWithWindow(smallPool, recent, () => 0);
    expect(smallPool.includes(line)).toBe(true);
    // Should choose the non-immediate line ('Alpha' since last is 'Bravo')
    expect(line).toBe('Alpha');
    expect(updatedRecent[updatedRecent.length - 1]).toBe('Alpha');
  });

  it('handles empty pool safely without throwing', () => {
    const { line, updatedRecent } = pickLineWithWindow([], ['prev1', 'prev2']);
    expect(line).toBe('');
    expect(updatedRecent).toEqual(['prev1', 'prev2']);
  });

  describe('getTimeOfDayGreetingContext', () => {
    it('returns lateNight for 22:00 through 04:59', () => {
      expect(getTimeOfDayGreetingContext(22)).toBe('lateNight');
      expect(getTimeOfDayGreetingContext(23)).toBe('lateNight');
      expect(getTimeOfDayGreetingContext(0)).toBe('lateNight');
      expect(getTimeOfDayGreetingContext(3)).toBe('lateNight');
      expect(getTimeOfDayGreetingContext(4)).toBe('lateNight');
    });

    it('returns morning for 05:00 through 11:59', () => {
      expect(getTimeOfDayGreetingContext(5)).toBe('morning');
      expect(getTimeOfDayGreetingContext(8)).toBe('morning');
      expect(getTimeOfDayGreetingContext(10)).toBe('morning');
      expect(getTimeOfDayGreetingContext(11)).toBe('morning');
    });

    it('returns evening for 17:00 through 21:59', () => {
      expect(getTimeOfDayGreetingContext(17)).toBe('evening');
      expect(getTimeOfDayGreetingContext(19)).toBe('evening');
      expect(getTimeOfDayGreetingContext(21)).toBe('evening');
    });

    it('returns null for midday and afternoon (12:00 through 16:59)', () => {
      expect(getTimeOfDayGreetingContext(12)).toBeNull();
      expect(getTimeOfDayGreetingContext(14)).toBeNull();
      expect(getTimeOfDayGreetingContext(16)).toBeNull();
    });
  });
});
