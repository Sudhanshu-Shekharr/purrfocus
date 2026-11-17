import type { BondLevel, OverlayType, PoseId } from './types';

export const STUDY_POSE_VARIANTS: readonly PoseId[] = [
  'study_book',
  'study_write',
  'study_laptop',
] as const;

export const DEFAULT_CAT_NAME = 'Mochi';
export const MIN_CAT_NAME_LENGTH = 1;
export const MAX_CAT_NAME_LENGTH = 20;

export const DEFAULT_CAT_ID = 'mochi';

export const BOND_THRESHOLDS: Record<BondLevel, number> = {
  stranger: 0,
  friend: 20,
  best_friend: 60,
  family: 150,
};

export const BOND_GAINS = {
  pet: 1,
  treat: 2,
  stretch: 1,
  focusMinute: 1,
  maxInteractionPointsPerHour: 5,
} as const;

export const COOLDOWNS = {
  pet: 1500,     // 1.5s
  treat: 10000,  // 10s
  play: 8000,    // 8s
} as const;

export const OVERLAY_DURATIONS: Record<OverlayType, number> = {
  celebrate: 3000,   // 3s
  sad_gentle: 2500,  // 2.5s
  pet_happy: 2000,   // 2s
  treat: 2500,       // 2.5s
  stretch: 10000,    // 10s
  play: 6000,        // max 6s (auto-ends)
};

export const IDLE_SLEEPY_MS = 120_000; // 2 minutes without interaction -> sleepy

export const THOUGHT_BUBBLE_ROTATION = {
  minIntervalMs: 25_000, // 25s
  maxIntervalMs: 40_000, // 40s
  announceThrottleMs: 30_000, // 30s
} as const;

export const NO_REPEAT_WINDOW_SIZE = 5;
