import type { BondLevel } from './types';
import { BOND_THRESHOLDS } from './constants';

const ORDERED_LEVELS: BondLevel[] = ['stranger', 'friend', 'best_friend', 'family'];

export function getBondLevel(points: number): BondLevel {
  const safePoints = Math.max(0, Math.floor(points));
  if (safePoints >= BOND_THRESHOLDS.family) return 'family';
  if (safePoints >= BOND_THRESHOLDS.best_friend) return 'best_friend';
  if (safePoints >= BOND_THRESHOLDS.friend) return 'friend';
  return 'stranger';
}

export function getBondLevelLabel(level: BondLevel): string {
  switch (level) {
    case 'family':
      return 'Family';
    case 'best_friend':
      return 'Best friend';
    case 'friend':
      return 'Friend';
    case 'stranger':
    default:
      return 'Stranger';
  }
}

export function isOutfitUnlocked(unlockAtLevel: BondLevel, currentPoints: number): boolean {
  const safePoints = Math.max(0, Math.floor(currentPoints));
  const threshold = BOND_THRESHOLDS[unlockAtLevel];
  return safePoints >= threshold;
}

export function getNextLevelInfo(currentPoints: number): {
  currentLevel: BondLevel;
  nextLevel: BondLevel | null;
  pointsToNext: number;
  progressPercent: number;
} {
  const safePoints = Math.max(0, Math.floor(currentPoints));
  const currentLevel = getBondLevel(safePoints);
  const currentIndex = ORDERED_LEVELS.indexOf(currentLevel);
  const nextLevel = ORDERED_LEVELS[currentIndex + 1] ?? null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      pointsToNext: 0,
      progressPercent: 100,
    };
  }

  const currentThreshold = BOND_THRESHOLDS[currentLevel];
  const nextThreshold = BOND_THRESHOLDS[nextLevel];
  const pointsInCurrentTier = safePoints - currentThreshold;
  const tierRange = nextThreshold - currentThreshold;
  const progressPercent = Math.min(100, Math.max(0, Math.round((pointsInCurrentTier / tierRange) * 100)));
  const pointsToNext = Math.max(0, nextThreshold - safePoints);

  return {
    currentLevel,
    nextLevel,
    pointsToNext,
    progressPercent,
  };
}
