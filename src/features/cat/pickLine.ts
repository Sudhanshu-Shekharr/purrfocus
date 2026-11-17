import { NO_REPEAT_WINDOW_SIZE } from './constants';

export type PickLineResult = {
  line: string;
  updatedRecent: string[];
};

/**
 * Pure line picker with a sliding no-repeat window of the last 5 lines.
 * Never repeats a line within the window. If all lines in the pool are
 * currently in the recent window, it falls back to picking from the pool.
 */
export function pickLineWithWindow(
  pool: readonly string[] | string[],
  recentLines: readonly string[] | string[],
  randomFn: () => number = Math.random,
): PickLineResult {
  if (!pool || pool.length === 0) {
    return { line: '', updatedRecent: [...recentLines] };
  }

  // 1. Filter out lines present in the recent window
  const recentSet = new Set(recentLines);
  let candidates = pool.filter(line => !recentSet.has(line));

  // 2. Fallback gracefully if all lines are in the recent window
  if (candidates.length === 0) {
    // Avoid repeating the immediately preceding line if pool has more than 1 item
    const lastLine = recentLines[recentLines.length - 1];
    const nonImmediate = pool.filter(l => l !== lastLine);
    candidates = nonImmediate.length > 0 ? nonImmediate : [...pool];
  }

  // 3. Pick random candidate
  const clampedRandom = Math.max(0, Math.min(0.999999, randomFn()));
  const index = Math.floor(clampedRandom * candidates.length);
  const selectedLine = candidates[index] ?? candidates[0] ?? '';

  // 4. Update recent window
  const updatedRecent = [...recentLines, selectedLine].slice(-NO_REPEAT_WINDOW_SIZE);

  return {
    line: selectedLine,
    updatedRecent,
  };
}

/**
 * Contextually detects morning, evening or lateNight time-of-day greetings on session start.
 * Late night: 22:00–04:59
 * Morning: 05:00–11:59
 * Evening: 17:00–21:59
 */
export function getTimeOfDayGreetingContext(
  input: number | Date = new Date(),
): 'lateNight' | 'morning' | 'evening' | null {
  const hour = typeof input === 'number' ? input : input.getHours();
  if (hour >= 22 || hour < 5) {
    return 'lateNight';
  }
  if (hour >= 5 && hour < 12) {
    return 'morning';
  }
  if (hour >= 17 && hour < 22) {
    return 'evening';
  }
  return null;
}
