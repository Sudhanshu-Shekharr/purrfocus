import { describe, it, expect, beforeEach } from 'vitest';
import { useCatStore, sanitizeCatState, getInitialCatState } from './store';
import { BOND_GAINS, DEFAULT_CAT_NAME } from './constants';
import { usePrefsStore } from '@/features/prefs/store';

describe('useCatStore', () => {
  beforeEach(() => {
    useCatStore.getState().resetCat();
    usePrefsStore.getState().resetPrefs();
  });

  it('initializes with default values', () => {
    const state = useCatStore.getState();
    expect(state.name).toBe(DEFAULT_CAT_NAME);
    expect(state.catId).toBe('mochi');
    expect(state.outfitId).toBeNull();
    expect(state.bond).toBe(0);
    expect(state.studyPoseVariant).toBe(0);
    expect(state.lastInteractionAt).toBe(0);
    expect(state.interactionBondHistory).toEqual([]);
  });

  describe('setName', () => {
    it('updates name and trims whitespace', () => {
      useCatStore.getState().setName('  Biscuit  ');
      expect(useCatStore.getState().name).toBe('Biscuit');
    });

    it('ignores empty or whitespace-only name', () => {
      useCatStore.getState().setName('   ');
      expect(useCatStore.getState().name).toBe(DEFAULT_CAT_NAME);
    });

    it('ignores name longer than 20 chars', () => {
      useCatStore.getState().setName('A'.repeat(21));
      expect(useCatStore.getState().name).toBe(DEFAULT_CAT_NAME);
    });

    it('accepts valid 1-char name and 20-char name', () => {
      useCatStore.getState().setName('M');
      expect(useCatStore.getState().name).toBe('M');

      useCatStore.getState().setName('A'.repeat(20));
      expect(useCatStore.getState().name).toBe('A'.repeat(20));
    });
  });

  describe('setCatId', () => {
    it('updates catId for non-empty string', () => {
      useCatStore.getState().setCatId('chai');
      expect(useCatStore.getState().catId).toBe('chai');
    });

    it('ignores empty string', () => {
      useCatStore.getState().setCatId('');
      expect(useCatStore.getState().catId).toBe('mochi');
    });
  });

  describe('setOutfitId', () => {
    it('updates outfitId or clears it with null', () => {
      useCatStore.getState().setOutfitId('scarf');
      expect(useCatStore.getState().outfitId).toBe('scarf');

      useCatStore.getState().setOutfitId(null);
      expect(useCatStore.getState().outfitId).toBeNull();
    });

    it('persists outfit selection and reloads correctly across page refresh', () => {
      useCatStore.getState().setCatId('chai');
      useCatStore.getState().setOutfitId('glasses');
      expect(useCatStore.getState().outfitId).toBe('glasses');
      expect(useCatStore.getState().catId).toBe('chai');

      const clean = sanitizeCatState({ catId: 'chai', outfitId: 'glasses' });
      expect(clean.catId).toBe('chai');
      expect(clean.outfitId).toBe('glasses');
    });
  });

  describe('addBond', () => {
    it('increments bond points', () => {
      useCatStore.getState().addBond(25);
      expect(useCatStore.getState().bond).toBe(25);

      useCatStore.getState().addBond(15);
      expect(useCatStore.getState().bond).toBe(40);
    });

    it('ignores negative or non-positive values', () => {
      useCatStore.getState().addBond(-10);
      expect(useCatStore.getState().bond).toBe(0);
    });
  });

  describe('awardInteractionBond', () => {
    it('awards points within the hourly budget', () => {
      const now = Date.now();
      const awarded = useCatStore.getState().awardInteractionBond('pet', now);
      expect(awarded).toBe(true);
      expect(useCatStore.getState().bond).toBe(BOND_GAINS.pet);
      expect(useCatStore.getState().interactionBondHistory).toHaveLength(1);
    });

    it('respects the hourly cap of 5 points', () => {
      const now = Date.now();
      // Award 2 + 2 = 4 points via treat
      useCatStore.getState().awardInteractionBond('treat', now);
      useCatStore.getState().awardInteractionBond('treat', now + 100);
      expect(useCatStore.getState().bond).toBe(4);

      // Next treat awards only 1 point to reach cap of 5
      const third = useCatStore.getState().awardInteractionBond('treat', now + 200);
      expect(third).toBe(true);
      expect(useCatStore.getState().bond).toBe(5);

      // Further interactions within hour award 0 points and return false
      const fourth = useCatStore.getState().awardInteractionBond('pet', now + 300);
      expect(fourth).toBe(false);
      expect(useCatStore.getState().bond).toBe(5);
    });

    it('prunes entries older than 1 hour', () => {
      const now = Date.now();
      const twoHoursAgo = now - 7_200_000;

      // Populate history with old entry
      useCatStore.setState({
        interactionBondHistory: [{ timestamp: twoHoursAgo, points: 5 }],
        bond: 5,
      });

      // Old entries do not count towards current hour budget
      const awarded = useCatStore.getState().awardInteractionBond('pet', now);
      expect(awarded).toBe(true);
      expect(useCatStore.getState().bond).toBe(6);
    });
  });

  describe('studyPoseVariant', () => {
    it('cycles study pose variants 0 -> 1 -> 2 -> 0', () => {
      expect(useCatStore.getState().studyPoseVariant).toBe(0);

      useCatStore.getState().cycleStudyPoseVariant();
      expect(useCatStore.getState().studyPoseVariant).toBe(1);

      useCatStore.getState().cycleStudyPoseVariant();
      expect(useCatStore.getState().studyPoseVariant).toBe(2);

      useCatStore.getState().cycleStudyPoseVariant();
      expect(useCatStore.getState().studyPoseVariant).toBe(0);
    });

    it('sets study pose variant directly', () => {
      useCatStore.getState().setStudyPoseVariant(2);
      expect(useCatStore.getState().studyPoseVariant).toBe(2);
    });
  });

  describe('recordInteraction', () => {
    it('records timestamp of interaction', () => {
      const now = 123456789;
      useCatStore.getState().recordInteraction(now);
      expect(useCatStore.getState().lastInteractionAt).toBe(now);
    });
  });

  describe('sanitizeCatState', () => {
    it('returns default initial state for null or invalid input', () => {
      const initial = getInitialCatState();
      expect(sanitizeCatState(null)).toEqual(initial);
      expect(sanitizeCatState(undefined)).toEqual(initial);
      expect(sanitizeCatState('corrupted')).toEqual(initial);
    });

    it('sanitizes partial or dirty values', () => {
      const dirty = {
        name: '   SuperLongCatNameExceedingTwentyCharacters   ',
        catId: '',
        outfitId: 123,
        bond: -10,
        studyPoseVariant: 99,
        lastInteractionAt: 'yesterday',
        interactionBondHistory: 'not an array',
      };

      const clean = sanitizeCatState(dirty);
      expect(clean.name).toBe('SuperLongCatNameExce'); // clamped to 20
      expect(clean.catId).toBe('mochi');
      expect(clean.outfitId).toBeNull();
      expect(clean.bond).toBe(0);
      expect(clean.studyPoseVariant).toBe(0);
      expect(clean.lastInteractionAt).toBe(0);
    });
  });
});
