import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '@/lib/storageDebounce';
import type { Prefs, PrefsStore } from './types';

export const PREFS_STORAGE_KEY = 'purrfocus:prefs:v1';
export const LEGACY_CAT_STORAGE_KEY = 'purrfocus:cat:v1';

export function getInitialPrefs(): Prefs {
  return {
    sfxOn: true,
    focusMode: false,
    rareEventsOn: true,
    lastWelcomeDay: null,
    clockFormat: 'auto',
    reduceMotion: 'system',
  };
}

/**
 * Checks legacy cat store in localStorage for sfxOn and returns the migrated value.
 * Used when initializing prefs on first load.
 */
export function migrateLegacySfxPref(): boolean | undefined {
  if (typeof window === 'undefined' || !window.localStorage) {
    return undefined;
  }
  try {
    const raw = window.localStorage.getItem(LEGACY_CAT_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'state' in parsed) {
      const state = (parsed as { state?: Record<string, unknown> }).state;
      if (state && typeof state.sfxOn === 'boolean') {
        const legacyValue = state.sfxOn;
        // Strip sfxOn from the legacy record so migration is one-time
        delete state.sfxOn;
        window.localStorage.setItem(LEGACY_CAT_STORAGE_KEY, JSON.stringify(parsed));
        return legacyValue;
      }
    }
  } catch {
    // Silently fall back to default
  }
  return undefined;
}

export function sanitizePrefs(persisted: unknown): Prefs {
  const defaults = getInitialPrefs();
  if (!persisted || typeof persisted !== 'object') {
    return defaults;
  }
  const p = persisted as Partial<Prefs>;
  const clockFormat =
    p.clockFormat === '12h' || p.clockFormat === '24h' || p.clockFormat === 'auto'
      ? p.clockFormat
      : defaults.clockFormat;

  const reduceMotion =
    p.reduceMotion === 'on' || p.reduceMotion === 'off' || p.reduceMotion === 'system'
      ? p.reduceMotion
      : defaults.reduceMotion;

  return {
    sfxOn: typeof p.sfxOn === 'boolean' ? p.sfxOn : defaults.sfxOn,
    focusMode: false, // Always false on rehydrate / session-only
    rareEventsOn: typeof p.rareEventsOn === 'boolean' ? p.rareEventsOn : defaults.rareEventsOn,
    lastWelcomeDay: typeof p.lastWelcomeDay === 'string' ? p.lastWelcomeDay : null,
    clockFormat,
    reduceMotion,
  };
}

export const usePrefsStore = create<PrefsStore>()(
  persist(
    (set) => {
      // Determine initial sfxOn, checking legacy cat store migration if prefs not yet persisted
      const migratedSfx = migrateLegacySfxPref();
      const initialSfxOn = migratedSfx !== undefined ? migratedSfx : true;

      return {
        ...getInitialPrefs(),
        sfxOn: initialSfxOn,

        setSfxOn: (sfxOn: boolean) => set({ sfxOn }),
        toggleSfx: () => set((state) => ({ sfxOn: !state.sfxOn })),

        setFocusMode: (focusMode: boolean) => set({ focusMode }),
        toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),

        setRareEventsOn: (rareEventsOn: boolean) => set({ rareEventsOn }),
        toggleRareEvents: () => set((state) => ({ rareEventsOn: !state.rareEventsOn })),

        setLastWelcomeDay: (lastWelcomeDay: string | null) => set({ lastWelcomeDay }),

        setClockFormat: (clockFormat) => set({ clockFormat }),

        setReduceMotion: (reduceMotion) => set({ reduceMotion }),

        resetPrefs: () => set(getInitialPrefs()),
      };
    },
    {
      name: PREFS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => debouncedStorage),
      // focusMode is strictly session-only and NOT persisted
      partialize: (state) => ({
        sfxOn: state.sfxOn,
        rareEventsOn: state.rareEventsOn,
        lastWelcomeDay: state.lastWelcomeDay,
        clockFormat: state.clockFormat,
        reduceMotion: state.reduceMotion,
      }),
      migrate: (persistedState) => sanitizePrefs(persistedState),
    },
  ),
);
