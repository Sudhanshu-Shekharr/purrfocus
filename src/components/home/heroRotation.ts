import { useEffect, useSyncExternalStore } from 'react';
import { HERO_FIRST_LINE_VARIANTS, HERO_ROTATION_INTERVAL_MS } from '@/data/hero';

export type HeroRotationSnapshot = {
  activeIndex: number;
  prevIndex: number | null;
};

/**
 * Module-level shared rotation controller for the hero first-line variants.
 *
 * Ordering policy: advances sequentially in cyclic order
 * `(activeIndex + 1) % HERO_FIRST_LINE_VARIANTS.length`, guaranteeing no variant
 * ever repeats back-to-back while staying deterministic across renders.
 *
 * Lifecycle:
 * - Persists `activeIndex` and remaining cycle time across route changes and
 *   Focus Mode toggles so the rotation does not restart to variant 1.
 * - Maintains at most one active `setTimeout` while at least one non-reduced-motion
 *   subscriber is mounted and the tab is visible.
 * - Pauses on `visibilitychange` (`document.hidden === true`) and resumes with
 *   the remaining time when visible again.
 * - Clears the timer and removes listeners immediately when all subscribers unmount.
 */
let snapshot: HeroRotationSnapshot = {
  activeIndex: 0,
  prevIndex: null,
};

const STATIC_SNAPSHOT: HeroRotationSnapshot = {
  activeIndex: 0,
  prevIndex: null,
};

let remainingMs: number = HERO_ROTATION_INTERVAL_MS;
let timerStartedAt: number | null = null;
let timerId: ReturnType<typeof setTimeout> | null = null;
let visibilityBound = false;

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach(listener => listener());
}

function clearScheduledTimer(): void {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
  timerStartedAt = null;
}

function pauseTimer(): void {
  if (timerId !== null && timerStartedAt !== null) {
    const elapsed = Date.now() - timerStartedAt;
    remainingMs = Math.max(0, remainingMs - elapsed);
  }
  clearScheduledTimer();
}

function scheduleNextTick(): void {
  if (listeners.size === 0) return;
  if (typeof document !== 'undefined' && document.hidden) return;
  if (timerId !== null) return;

  const delay = remainingMs;
  timerStartedAt = Date.now();
  timerId = setTimeout(() => {
    timerId = null;
    timerStartedAt = null;

    const prevIndex = snapshot.activeIndex;
    const nextIndex = (snapshot.activeIndex + 1) % HERO_FIRST_LINE_VARIANTS.length;
    snapshot = { activeIndex: nextIndex, prevIndex };
    remainingMs = HERO_ROTATION_INTERVAL_MS;
    emit();

    scheduleNextTick();
  }, delay);
}

function handleVisibilityChange(): void {
  if (typeof document === 'undefined') return;
  if (document.hidden) {
    pauseTimer();
  } else {
    scheduleNextTick();
  }
}

function bindVisibilityListener(): void {
  if (visibilityBound || typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', handleVisibilityChange);
  visibilityBound = true;
}

function unbindVisibilityListener(): void {
  if (!visibilityBound || typeof document === 'undefined') return;
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  visibilityBound = false;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  bindVisibilityListener();
  scheduleNextTick();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      pauseTimer();
      unbindVisibilityListener();
    }
  };
}

function getSnapshot(): HeroRotationSnapshot {
  return snapshot;
}

function getStaticSnapshot(): HeroRotationSnapshot {
  return STATIC_SNAPSHOT;
}

function noopSubscribe(): () => void {
  return () => {};
}

/**
 * Resets module rotation state and clears any active timer.
 * Intended for deterministic unit testing.
 */
export function resetHeroRotationForTesting(): void {
  clearScheduledTimer();
  unbindVisibilityListener();
  listeners.clear();
  snapshot = { activeIndex: 0, prevIndex: null };
  remainingMs = HERO_ROTATION_INTERVAL_MS;
}

/**
 * Subscribes to the shared hero headline rotation when motion is allowed.
 * When `disabled` is true (reduced motion), schedules zero timers and returns
 * variant 0 statically.
 */
export function useHeroRotation(disabled: boolean): HeroRotationSnapshot {
  const current = useSyncExternalStore(
    disabled ? noopSubscribe : subscribe,
    disabled ? getStaticSnapshot : getSnapshot,
    getStaticSnapshot,
  );

  // Ensure timers are immediately cleared if reduced-motion flips on while mounted
  useEffect(() => {
    if (disabled && listeners.size === 0) {
      clearScheduledTimer();
      unbindVisibilityListener();
    }
  }, [disabled]);

  return current;
}
