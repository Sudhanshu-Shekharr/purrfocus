import type { CollectibleId } from '@/data/collectibles';
import type { StreakResult } from './streak';

export type MinimalSessionLog = {
  minutes: number;
};

/**
 * Computes total focus minutes from completed session logs.
 */
export function computeTotalFocusMinutes(logs: readonly MinimalSessionLog[]): number {
  return logs.reduce((acc, log) => acc + (log.minutes > 0 ? log.minutes : 0), 0);
}

/**
 * Pure unlock calculator for Desk collectibles.
 *
 * Rules:
 * - tea-mug: 60 focus minutes
 * - plant: 120 focus minutes
 * - lamp: 240 focus minutes
 * - photo-frame: 480 focus minutes
 * - bookmark: 3-day streak
 */
export function computeUnlocked(
  logs: readonly MinimalSessionLog[],
  streak: StreakResult | number,
): CollectibleId[] {
  const totalMinutes = computeTotalFocusMinutes(logs);
  const streakCount = typeof streak === 'number' ? streak : streak.current;

  const unlocked: CollectibleId[] = [];

  if (totalMinutes >= 60) {
    unlocked.push('tea-mug');
  }
  if (totalMinutes >= 120) {
    unlocked.push('plant');
  }
  if (totalMinutes >= 240) {
    unlocked.push('lamp');
  }
  if (totalMinutes >= 480) {
    unlocked.push('photo-frame');
  }
  if (streakCount >= 3) {
    unlocked.push('bookmark');
  }

  return unlocked;
}
