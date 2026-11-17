import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '@/lib/storageDebounce';
import type { CatState, InteractionBondEntry } from './types';
import {
  DEFAULT_CAT_ID,
  DEFAULT_CAT_NAME,
  MAX_CAT_NAME_LENGTH,
  MIN_CAT_NAME_LENGTH,
  BOND_GAINS,
} from './constants';
import { getCatDefinition } from '@/data/cats';
import { usePrefsStore } from '@/features/prefs/store';

export type CatStore = CatState & {
  setName: (name: string) => void;
  setCatId: (catId: string) => void;
  setOutfitId: (outfitId: string | null) => void;
  addBond: (points: number) => void;
  awardInteractionBond: (type: 'pet' | 'treat' | 'stretch', now?: number) => boolean;
  setStudyPoseVariant: (variant: 0 | 1 | 2) => void;
  cycleStudyPoseVariant: () => void;
  recordInteraction: (now?: number) => void;
  resetCat: () => void;
};

const ONE_HOUR_MS = 3_600_000;

export function getInitialCatState(): CatState {
  return {
    name: DEFAULT_CAT_NAME,
    catId: DEFAULT_CAT_ID,
    outfitId: null,
    bond: 0,
    studyPoseVariant: 0,
    lastInteractionAt: 0,
    interactionBondHistory: [],
  };
}

export function sanitizeCatState(persisted: unknown): CatState {
  const initial = getInitialCatState();
  if (!persisted || typeof persisted !== 'object') {
    return initial;
  }

  const p = persisted as Partial<CatState>;

  let name = initial.name;
  if (typeof p.name === 'string') {
    const trimmed = p.name.trim();
    if (trimmed.length >= MIN_CAT_NAME_LENGTH) {
      name = trimmed.slice(0, MAX_CAT_NAME_LENGTH);
    }
  }

  const catId = typeof p.catId === 'string' && p.catId.trim().length > 0 ? p.catId : initial.catId;

  const outfitId =
    typeof p.outfitId === 'string' ? p.outfitId : p.outfitId === null ? null : initial.outfitId;

  const bond = typeof p.bond === 'number' && Number.isFinite(p.bond) ? Math.max(0, Math.floor(p.bond)) : 0;

  const studyPoseVariant =
    p.studyPoseVariant === 0 || p.studyPoseVariant === 1 || p.studyPoseVariant === 2
      ? p.studyPoseVariant
      : 0;

  const lastInteractionAt =
    typeof p.lastInteractionAt === 'number' && Number.isFinite(p.lastInteractionAt)
      ? p.lastInteractionAt
      : 0;

  const interactionBondHistory: InteractionBondEntry[] = [];
  if (Array.isArray(p.interactionBondHistory)) {
    for (const item of p.interactionBondHistory) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.timestamp === 'number' &&
        typeof item.points === 'number'
      ) {
        interactionBondHistory.push({
          timestamp: item.timestamp,
          points: item.points,
        });
      }
    }
  }

  return {
    name,
    catId,
    outfitId,
    bond,
    studyPoseVariant,
    lastInteractionAt,
    interactionBondHistory,
  };
}

export const useCatStore = create<CatStore>()(
  persist(
    (set, get) => ({
      ...getInitialCatState(),

      setName: (rawName: string) => {
        const trimmed = rawName.trim();
        if (trimmed.length >= MIN_CAT_NAME_LENGTH && trimmed.length <= MAX_CAT_NAME_LENGTH) {
          set({ name: trimmed });
        }
      },

      setCatId: (catId: string) => {
        if (catId && typeof catId === 'string') {
          const currentCat = get().catId;
          const currentName = get().name;
          const prevDef = getCatDefinition(currentCat);
          const nextDef = getCatDefinition(catId);
          if (currentName === prevDef.name || currentName === DEFAULT_CAT_NAME || !currentName) {
            set({ catId, name: nextDef.name });
          } else {
            set({ catId });
          }
        }
      },

      setOutfitId: (outfitId: string | null) => {
        set({ outfitId });
      },

      addBond: (points: number) => {
        const safe = Math.max(0, Math.floor(points));
        if (safe > 0) {
          set(state => ({ bond: state.bond + safe }));
        }
      },

      awardInteractionBond: (type: 'pet' | 'treat' | 'stretch', now: number = Date.now()) => {
        const gain = BOND_GAINS[type];
        const state = get();
        const cutoff = now - ONE_HOUR_MS;

        // Clean up history older than 1 hour
        const freshHistory = state.interactionBondHistory.filter(e => e.timestamp > cutoff);
        const pointsInLastHour = freshHistory.reduce((sum, e) => sum + e.points, 0);
        const remainingBudget = Math.max(0, BOND_GAINS.maxInteractionPointsPerHour - pointsInLastHour);

        if (remainingBudget <= 0) {
          set({
            interactionBondHistory: freshHistory,
            lastInteractionAt: now,
          });
          return false;
        }

        const pointsToAward = Math.min(gain, remainingBudget);
        set({
          bond: state.bond + pointsToAward,
          lastInteractionAt: now,
          interactionBondHistory: [
            ...freshHistory,
            { timestamp: now, points: pointsToAward },
          ],
        });
        return true;
      },

      setStudyPoseVariant: (variant: 0 | 1 | 2) => {
        set({ studyPoseVariant: variant });
      },

      cycleStudyPoseVariant: () => {
        set(state => ({
          studyPoseVariant: ((state.studyPoseVariant + 1) % 3) as 0 | 1 | 2,
        }));
      },

      recordInteraction: (now: number = Date.now()) => {
        set({ lastInteractionAt: now });
      },

      resetCat: () => {
        set(getInitialCatState());
      },
    }),
    {
      name: 'purrfocus:cat:v1',
      version: 2,
      storage: createJSONStorage(() => debouncedStorage),
      partialize: state => ({
        name: state.name,
        catId: state.catId,
        outfitId: state.outfitId,
        bond: state.bond,
        studyPoseVariant: state.studyPoseVariant,
        lastInteractionAt: state.lastInteractionAt,
        interactionBondHistory: state.interactionBondHistory,
      }),
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2 && persistedState && typeof persistedState === 'object') {
          const p = persistedState as Record<string, unknown>;
          if (typeof p.sfxOn === 'boolean') {
            try {
              usePrefsStore.getState().setSfxOn(p.sfxOn);
            } catch {
              // Ignore in environments without window/store initialized
            }
            delete p.sfxOn;
          }
        }
        return sanitizeCatState(persistedState);
      },
    },
  ),
);
