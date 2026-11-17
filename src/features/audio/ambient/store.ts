import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AmbientStoreState,
  AmbientPersistedState,
  AmbientLayerId,
} from './types';

export const AMBIENT_STORAGE_KEY = 'purrfocus:ambient:v1';
export const DEFAULT_MASTER = 0.7;
export const DEFAULT_LAYER_LEVEL = 0.6;

export function clampGain(value: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

export function getInitialAmbientPersistedState(): AmbientPersistedState {
  return {
    levels: {
      'soft-piano': 0,
      rainfall: 0,
      'brown-noise': 0,
    },
    master: DEFAULT_MASTER,
    muted: false,
  };
}

export function sanitizeAmbientState(persisted: unknown): AmbientPersistedState {
  const defaults = getInitialAmbientPersistedState();
  if (!persisted || typeof persisted !== 'object') {
    return defaults;
  }

  const p = persisted as Partial<AmbientPersistedState>;
  const sanitizedLevels: Record<string, number> = { ...defaults.levels };

  if (p.levels && typeof p.levels === 'object') {
    for (const [id, lvl] of Object.entries(p.levels)) {
      if (typeof lvl === 'number') {
        sanitizedLevels[id] = clampGain(lvl);
      }
    }
  }

  const parsedMaster = typeof p.master === 'number' ? clampGain(p.master) : defaults.master;

  return {
    levels: sanitizedLevels,
    master: parsedMaster > 0 ? parsedMaster : defaults.master,
    muted: typeof p.muted === 'boolean' ? p.muted : defaults.muted,
  };
}

export const useAmbientStore = create<AmbientStoreState>()(
  persist(
    (set, get) => ({
      ...getInitialAmbientPersistedState(),
      sessionStarted: false, // Session-only; not persisted

      setLevel: (layerId: AmbientLayerId, level: number, markStarted = true) => {
        const clamped = clampGain(level);
        set(state => ({
          levels: {
            ...state.levels,
            [layerId]: clamped,
          },
          sessionStarted: markStarted && clamped > 0 ? true : state.sessionStarted,
        }));
      },

      toggleLayer: (layerId: AmbientLayerId) => {
        const state = get();
        const currentLevel = state.levels[layerId] ?? 0;
        const nextLevel = currentLevel > 0 ? 0 : DEFAULT_LAYER_LEVEL;
        const nextMaster = nextLevel > 0 && state.master <= 0 ? DEFAULT_MASTER : state.master;
        set(s => ({
          levels: {
            ...s.levels,
            [layerId]: nextLevel,
          },
          master: nextMaster,
          muted: nextLevel > 0 ? false : s.muted,
          sessionStarted: nextLevel > 0 ? true : s.sessionStarted,
        }));
      },

      selectSound: (layerId: AmbientLayerId) => {
        const state = get();
        const currentLevel = state.levels[layerId] ?? 0;
        const isActive = currentLevel > 0;
        const nextMaster = state.master <= 0 ? DEFAULT_MASTER : state.master;

        if (isActive) {
          // Clicking an active sound toggles it off
          set(s => ({
            levels: {
              ...s.levels,
              [layerId]: 0,
            },
          }));
        } else {
          // Clicking another sound switches to it and turns off other preset sounds
          set(s => ({
            levels: {
              ...s.levels,
              'soft-piano': layerId === 'soft-piano' ? DEFAULT_LAYER_LEVEL : 0,
              rainfall: layerId === 'rainfall' ? DEFAULT_LAYER_LEVEL : 0,
              'brown-noise': layerId === 'brown-noise' ? DEFAULT_LAYER_LEVEL : 0,
            },
            master: nextMaster,
            muted: false,
            sessionStarted: true,
          }));
        }
      },

      setMaster: (master: number) => {
        const clamped = clampGain(master);
        set(state => ({
          master: clamped,
          sessionStarted: clamped > 0 ? true : state.sessionStarted,
          muted: clamped > 0 ? false : state.muted,
        }));
      },

      setMuted: (muted: boolean) => {
        set({ muted });
      },

      toggleMute: () => {
        set(state => {
          const nextMuted = !state.muted;
          return {
            muted: nextMuted,
            sessionStarted: !nextMuted ? true : state.sessionStarted,
          };
        });
      },

      setSessionStarted: (started = true) => {
        set({ sessionStarted: started });
      },

      togglePlayback: () => {
        const state = get();
        const audible = selectIsAudible(state);

        if (audible) {
          // If currently playing, quick-mute
          set({ muted: true });
        } else {
          // If muted, unmute
          if (state.muted) {
            set({ muted: false, sessionStarted: true });
            return;
          }

          // If no layer is turned on, turn on soft-piano as default preset
          const anyLevelOn = Object.values(state.levels).some(lvl => lvl > 0);
          const nextMaster = state.master <= 0 ? DEFAULT_MASTER : state.master;
          if (!anyLevelOn) {
            set(prev => ({
              levels: {
                ...prev.levels,
                'soft-piano': DEFAULT_LAYER_LEVEL,
              },
              master: nextMaster,
              sessionStarted: true,
              muted: false,
            }));
          } else {
            set({ sessionStarted: true, muted: false, master: nextMaster });
          }
        }
      },

      resetMix: () => {
        set({
          ...getInitialAmbientPersistedState(),
        });
      },
    }),
    {
      name: AMBIENT_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        levels: state.levels,
        master: state.master,
        muted: state.muted,
      }),
      migrate: persisted => sanitizeAmbientState(persisted),
      onRehydrateStorage: () => state => {
        if (state) {
          const sanitized = sanitizeAmbientState(state);
          state.levels = sanitized.levels;
          state.master = sanitized.master > 0 ? sanitized.master : DEFAULT_MASTER;
          state.muted = sanitized.muted;
          state.sessionStarted = false;
        }
      },
    },
  ),
);

/**
 * Derived audible status:
 * Audible if user has interacted this session, not muted, master > 0, and >= 1 layer level > 0.
 */
export function selectIsAudible(state: AmbientStoreState): boolean {
  if (!state.sessionStarted || state.muted || state.master <= 0) {
    return false;
  }
  return Object.values(state.levels).some(lvl => lvl > 0);
}

/**
 * Effective gain for a layer = level * master * (muted ? 0 : 1).
 * If session is not started, effective gain is 0.
 */
export function selectEffectiveGain(state: AmbientStoreState, layerId: string): number {
  if (!state.sessionStarted || state.muted) {
    return 0;
  }
  const level = state.levels[layerId] ?? 0;
  return clampGain(level * state.master);
}
