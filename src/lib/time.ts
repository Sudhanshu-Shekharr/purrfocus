/**
 * Clamps a number between a minimum and maximum boundary.
 */
export function clamp(n: number, min: number, max: number): number {
  if (min > max) {
    return Math.min(Math.max(n, max), min);
  }
  return Math.min(Math.max(n, min), max);
}

/**
 * Formats a duration in seconds to a standard 'MM:SS' display string.
 * Non-integer inputs are floored, and negative numbers clamp to '00:00'.
 */
export function formatClock(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = remainingSeconds.toString().padStart(2, '0');

  return `${mm}:${ss}`;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'lateNight';

/**
 * Determines the time of day for greeting selection and scene suggestions:
 * - morning: 05:00–11:59
 * - afternoon: 12:00–16:59
 * - evening: 17:00–21:59
 * - lateNight: 22:00–04:59
 */
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hours = date.getHours();

  if (hours >= 5 && hours < 12) {
    return 'morning';
  }
  if (hours >= 12 && hours < 17) {
    return 'afternoon';
  }
  if (hours >= 17 && hours < 22) {
    return 'evening';
  }
  return 'lateNight';
}
