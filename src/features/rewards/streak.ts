import { getTodayDateString } from '@/features/timer/constants';

export type StreakResult = {
  /** Length of the current consecutive active day streak */
  current: number;
  /** ISO date string ('YYYY-MM-DD') of the most recent active session day, or null if none */
  lastActiveDay: string | null;
  /** Calendar days elapsed since the most recent active day */
  gapDays: number;
};

/**
 * Parses a 'YYYY-MM-DD' calendar date string to UTC timestamp for exact day-difference math.
 */
function parseDateToUtc(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y!, m! - 1, d!);
}

/**
 * Calculates calendar day difference between two 'YYYY-MM-DD' strings (from - to).
 */
export function diffCalendarDays(fromStr: string, toStr: string): number {
  const fromUtc = parseDateToUtc(fromStr);
  const toUtc = parseDateToUtc(toStr);
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((fromUtc - toUtc) / MS_PER_DAY);
}

/**
 * Shifts a 'YYYY-MM-DD' date by a given number of days.
 */
export function shiftDate(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y!, m! - 1, d!);
  date.setDate(date.getDate() + offsetDays);
  return getTodayDateString(date);
}

/**
 * Pure streak calculator with gentle 1-day grace period.
 *
 * Rules:
 * - A streak day is a local calendar day with at least one completed focus session.
 * - Streak length is consecutive active days ending today or yesterday (grace period: yesterday
 *   counts so you don't 'break' the streak until day 2 of absence).
 * - If last active day was >= 2 days ago, streak is 0; gapDays records days since last session.
 * - No loss states, negative counts, or guilt language.
 */
export function calculateStreak(
  dates: readonly string[] | string[],
  referenceDay: string = getTodayDateString(),
): StreakResult {
  const uniqueDates = Array.from(new Set(dates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))));

  if (uniqueDates.length === 0) {
    return {
      current: 0,
      lastActiveDay: null,
      gapDays: Infinity,
    };
  }

  // Sort descending (most recent first)
  uniqueDates.sort((a, b) => b.localeCompare(a));
  const lastActiveDay = uniqueDates[0]!;

  const daysSince = diffCalendarDays(referenceDay, lastActiveDay);
  const gapDays = Math.max(0, daysSince);

  // If last active was 2 or more days ago, current streak is 0 (grace period lapsed)
  if (gapDays >= 2) {
    return {
      current: 0,
      lastActiveDay,
      gapDays,
    };
  }

  // Count consecutive active days backwards starting from lastActiveDay
  const activeSet = new Set(uniqueDates);
  let count = 0;
  let cursor = lastActiveDay;

  while (activeSet.has(cursor)) {
    count++;
    cursor = shiftDate(cursor, -1);
  }

  return {
    current: count,
    lastActiveDay,
    gapDays,
  };
}
