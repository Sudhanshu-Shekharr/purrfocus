import type { SessionLog } from './types';
import { calculateStreak } from '@/features/rewards/streak';
import type { StreakResult } from '@/features/rewards/streak';
import { getTodayDateString } from '@/features/timer/constants';

/**
 * Returns local YYYY-MM-DD for a given epoch ms (uses local timezone).
 * Uses sv locale which formats as YYYY-MM-DD natively.
 */
function epochToLocalDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString('sv');
}

/**
 * Returns the last N local date strings including today, sorted ascending.
 * e.g. lastNLocalDays(3, '2026-10-28') => ['2026-10-26', '2026-10-27', '2026-10-28']
 */
function lastNLocalDays(n: number, today?: string): string[] {
  const refToday = today ?? getTodayDateString();
  const [y, m, d] = refToday.split('-').map(Number);
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(y!, m! - 1, d!);
    dt.setDate(dt.getDate() - i);
    result.push(getTodayDateString(dt));
  }
  return result;
}

export type DateRange = 'today' | 'week' | 'all';

function filterByRange(
  logs: readonly SessionLog[],
  range: DateRange,
  today?: string,
): readonly SessionLog[] {
  const refToday = today ?? getTodayDateString();
  if (range === 'today') {
    return logs.filter(l => l.date === refToday);
  }
  if (range === 'week') {
    const weekDays = new Set(lastNLocalDays(7, refToday));
    return logs.filter(l => weekDays.has(l.date));
  }
  return logs; // 'all'
}

export function totalsFor(
  logs: readonly SessionLog[],
  range: DateRange,
  today?: string,
): { minutes: number; sessions: number } {
  const filtered = filterByRange(logs, range, today);
  const minutes = filtered.reduce((acc, l) => acc + l.minutes, 0);
  return { minutes, sessions: filtered.length };
}

export function minutesByDay(
  logs: readonly SessionLog[],
  lastNDays: number,
  today?: string,
): Record<string, number> {
  const days = lastNLocalDays(lastNDays, today);
  // Seed all days with 0
  const result: Record<string, number> = {};
  for (const day of days) {
    result[day] = 0;
  }
  const daySet = new Set(days);
  for (const log of logs) {
    // Use log.date (which should already be local YYYY-MM-DD)
    const dateKey = log.date;
    if (daySet.has(dateKey)) {
      result[dateKey] = (result[dateKey] ?? 0) + log.minutes;
    }
  }
  return result;
}

export function minutesBySubject(
  logs: readonly SessionLog[],
  range: DateRange,
  today?: string,
): Record<string, number> {
  const filtered = filterByRange(logs, range, today);
  const result: Record<string, number> = {};
  for (const log of filtered) {
    const key = log.subject ?? 'Untagged';
    result[key] = (result[key] ?? 0) + log.minutes;
  }
  return result;
}

export function sessionsForJournal(
  logs: readonly SessionLog[],
  filters: { weekOnly?: boolean; subject?: string | null },
  today?: string,
): SessionLog[] {
  let filtered: readonly SessionLog[] = logs;

  if (filters.weekOnly) {
    const weekDays = new Set(lastNLocalDays(7, today));
    filtered = filtered.filter(l => weekDays.has(l.date));
  }

  if (filters.subject !== undefined) {
    filtered = filtered.filter(l => l.subject === filters.subject);
  }

  // Sort newest first by completedAt descending
  return [...filtered].sort((a, b) => b.completedAt - a.completedAt);
}

export function currentStreak(logs: readonly SessionLog[], today?: string): StreakResult {
  const dates = logs.map(l => l.date);
  return calculateStreak(dates, today ?? getTodayDateString());
}

// Expose internal helpers for testing
export { epochToLocalDate, lastNLocalDays };
