import { useEffect } from 'react';
import { useTimerStore } from './store';
import type { Mode } from './types';

export type ShortcutCallbacks = {
  onRequestSwitchConfirm?: (target: Mode) => void;
};

function isEditableElement(el: Element | null): boolean {
  if (!el || typeof el.tagName !== 'string') return false;
  const tagName = el.tagName.toLowerCase();
  if (['input', 'textarea', 'select'].includes(tagName)) return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

function isInsideOverlay(el: Element | null): boolean {
  if (!el || typeof el.closest !== 'function') return false;
  return Boolean(el.closest('[role="dialog"], [role="menu"]'));
}

function isInteractiveClickable(el: Element | null): boolean {
  if (!el || typeof el.tagName !== 'string') return false;
  const tagName = el.tagName.toLowerCase();
  if (['button', 'a'].includes(tagName)) return true;
  if (typeof el.getAttribute === 'function') {
    const role = el.getAttribute('role');
    if (role === 'tab' || role === 'button') return true;
  }
  return false;
}

export function useTimerShortcuts(callbacks?: ShortcutCallbacks): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modifier key held
      if (e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }

      const target = e.target as HTMLElement | null;

      // Ignore if typing inside text fields or contenteditable
      if (isEditableElement(target)) {
        return;
      }

      // Ignore if focus is inside modal or popover overlay
      if (isInsideOverlay(target)) {
        return;
      }

      const key = e.key;

      // 1. Space: start / pause / resume / advance
      if (key === ' ' || key === 'Spacebar') {
        // Ignore if focus is on a button, link or tab (avoid double trigger)
        if (isInteractiveClickable(target)) {
          return;
        }

        e.preventDefault();
        const state = useTimerStore.getState();
        switch (state.status) {
          case 'idle':
            state.start();
            break;
          case 'running':
            state.pause();
            break;
          case 'paused':
            state.resume();
            break;
          case 'finished':
            state.advance();
            break;
        }
        return;
      }

      // 2. R: Reset timer
      if (key === 'r' || key === 'R') {
        e.preventDefault();
        useTimerStore.getState().reset();
        return;
      }

      // 3. 1 / 2 / 3: Mode switching
      if (key === '1' || key === '2' || key === '3') {
        const modeMap: Record<string, Mode> = {
          '1': 'focus',
          '2': 'shortBreak',
          '3': 'longBreak',
        };
        const targetMode = modeMap[key];
        if (!targetMode) return;

        const state = useTimerStore.getState();
        if (state.mode === targetMode) return;

        e.preventDefault();

        const hasActiveSession =
          state.status === 'running' ||
          (state.status === 'paused' && state.remaining < state.durations[state.mode]);

        if (hasActiveSession) {
          callbacks?.onRequestSwitchConfirm?.(targetMode);
        } else {
          state.switchMode(targetMode);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [callbacks]);
}
