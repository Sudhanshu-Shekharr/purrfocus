import type { Mode, Status } from '@/features/timer/types';
import type { OverlayType, PoseId } from './types';
import { STUDY_POSE_VARIANTS, OVERLAY_DURATIONS } from './constants';

export type DeriveBasePoseParams = {
  mode: Mode;
  status: Status;
  studyPoseVariant?: 0 | 1 | 2;
};

/**
 * Pure state machine deriving the cat base pose from timer state and idle status.
 */
export function deriveBasePose(
  { mode, status, studyPoseVariant = 0 }: DeriveBasePoseParams,
  isIdleSleepy: boolean = false,
): PoseId {
  // 1. Focus mode running
  if (mode === 'focus' && status === 'running') {
    const variantIndex = studyPoseVariant >= 0 && studyPoseVariant <= 2 ? studyPoseVariant : 0;
    return STUDY_POSE_VARIANTS[variantIndex] ?? 'study_book';
  }

  // 2. Focus mode paused
  if (mode === 'focus' && status === 'paused') {
    return 'idle_happy';
  }

  // 3. Short break (running or paused)
  if (mode === 'shortBreak' && (status === 'running' || status === 'paused')) {
    return 'break_tea';
  }

  // 4. Long break (running or paused)
  if (mode === 'longBreak' && (status === 'running' || status === 'paused')) {
    return 'break_nap';
  }

  // 5. Finished (timer completed; celebrate overlay plays first, then base is idle_happy)
  if (status === 'finished') {
    return 'idle_happy';
  }

  // 6. Idle state (any mode)
  if (status === 'idle') {
    return isIdleSleepy ? 'sleepy' : 'idle_happy';
  }

  return 'idle_happy';
}

/**
 * Overlay conflict and precedence resolution.
 * A 'celebrate' overlay from a finished focus session is NEVER interrupted by Pet or Treat.
 */
export function canTriggerOverlay(
  currentOverlay: OverlayType | null,
  newOverlay: OverlayType,
): boolean {
  if (currentOverlay === 'celebrate' && (newOverlay === 'pet_happy' || newOverlay === 'treat')) {
    return false;
  }
  return true;
}

/**
 * Play (yarn ball) is blocked during an active focus session.
 */
export function isPlayAllowed(status: Status, mode: Mode): boolean {
  return !(status === 'running' && mode === 'focus');
}

/**
 * Sad gentle pose should only be triggered if the timer was reset mid-session
 * while focus was actively running or paused with progress.
 */
export function shouldShowSadGentle(
  lastStatus: Status | null,
  lastMode: Mode | null,
): boolean {
  return (
    lastMode === 'focus' &&
    (lastStatus === 'running' || lastStatus === 'paused')
  );
}

/**
 * Get duration in milliseconds for an overlay.
 */
export function getOverlayDuration(type: OverlayType): number {
  return OVERLAY_DURATIONS[type];
}
