import { useEffect } from 'react';
import { useTimerStore } from './store';
import { MODE_LABELS } from './constants';
import { formatClock } from '@/lib/time';

const DEFAULT_TITLE = 'Purrfocus';

export function getTitleForTimerState(
  status: string,
  mode: 'focus' | 'shortBreak' | 'longBreak',
  remaining: number,
): string {
  const modeLabel = MODE_LABELS[mode] ?? 'Focus';
  const timeStr = formatClock(remaining);

  if (status === 'running') {
    return `${timeStr} · ${modeLabel}`;
  }
  if (status === 'paused') {
    return `Paused · ${timeStr} · ${modeLabel}`;
  }
  return DEFAULT_TITLE;
}

/**
 * Updates document.title based on timer state.
 * Subscribes directly to Zustand outside of React render cycles to avoid re-renders.
 */
export function useDocumentTitle(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const originalTitle = document.title || DEFAULT_TITLE;

    const updateTitle = (state: ReturnType<typeof useTimerStore.getState>): void => {
      document.title = getTitleForTimerState(state.status, state.mode, state.remaining);
    };

    // Set initial title
    updateTitle(useTimerStore.getState());

    // Subscribe to store updates
    const unsubscribe = useTimerStore.subscribe(state => {
      updateTitle(state);
    });

    return () => {
      unsubscribe();
      document.title = originalTitle;
    };
  }, []);
}
