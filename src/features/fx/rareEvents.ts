import type { Mode, Status } from '@/features/timer/types';
import type { SceneId } from '@/features/scenery/types';

export type RareEventType = 'butterfly' | 'leafDrift' | 'birdChirp';

export const SCENE_RARE_EVENTS: Record<SceneId, RareEventType[]> = {
  scene1: ['leafDrift', 'birdChirp'],
  scene2: ['leafDrift'],
  scene3: [],
  scene4: ['butterfly'],
  scene5: ['butterfly', 'leafDrift', 'birdChirp'],
};

export const RARE_EVENT_CONSTANTS = {
  CHECK_INTERVAL_MS: 90_000, // 90 seconds
  PROBABILITY: 0.12, // 12%
  COOLDOWN_MS: 10 * 60 * 1000, // 10 minutes
  DURATIONS_MS: {
    butterfly: 10_000,
    leafDrift: 8_000,
    birdChirp: 4_000,
  },
} as const;

export function getRareEventsForScene(sceneId: SceneId): RareEventType[] {
  return SCENE_RARE_EVENTS[sceneId] ?? [];
}

export interface ShouldTriggerParams {
  timerStatus: Status;
  timerMode: Mode;
  rareEventsOn: boolean;
  reducedMotion: boolean;
  hasActiveEvent: boolean;
  lastEventTime: number;
  now: number;
  randomValue: number; // [0, 1)
  sceneId: SceneId;
  focusMode?: boolean;
}

/**
 * Pure decision function evaluating whether a rare event should spawn.
 * Enforces:
 * - Max 1 active event at a time
 * - 10-minute cooldown between events
 * - Quiet Focus Rule: NO rare events while timer is running in focus mode or focusMode is active
 * - Preferences toggle: rareEventsOn
 * - prefers-reduced-motion: reduce suppression
 * - 12% probability threshold per evaluation
 * - Scene-specific suitability
 */
export function shouldTriggerRareEvent(params: ShouldTriggerParams): RareEventType | null {
  const {
    timerStatus,
    timerMode,
    rareEventsOn,
    reducedMotion,
    hasActiveEvent,
    lastEventTime,
    now,
    randomValue,
    sceneId,
    focusMode,
  } = params;

  // 1. Max 1 active event
  if (hasActiveEvent) {
    return null;
  }

  // 2. Cooldown check (10 minutes)
  if (now - lastEventTime < RARE_EVENT_CONSTANTS.COOLDOWN_MS) {
    return null;
  }

  // 3. Focus Mode suppression: Never during running timer focus OR UI focusMode
  if ((timerStatus === 'running' && timerMode === 'focus') || focusMode) {
    return null;
  }

  // 4. Prefs and reduced motion gates
  if (!rareEventsOn || reducedMotion) {
    return null;
  }

  // 5. Scene check
  const available = getRareEventsForScene(sceneId);
  if (available.length === 0) {
    return null;
  }

  // 6. Probability check (12%)
  if (randomValue >= RARE_EVENT_CONSTANTS.PROBABILITY) {
    return null;
  }

  // 7. Pick candidate
  const normalizedIndex = Math.floor(
    (randomValue / RARE_EVENT_CONSTANTS.PROBABILITY) * available.length,
  );
  const picked = available[Math.min(available.length - 1, Math.max(0, normalizedIndex))];
  return picked ?? null;
}
