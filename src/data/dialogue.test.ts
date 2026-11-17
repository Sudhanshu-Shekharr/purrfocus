import { describe, it, expect } from 'vitest';
import dialogueJson from './dialogue.json';
import {
  validateDialogueData,
  DIALOGUE_DATA,
  pickLine,
  hashSeed,
  getSessionCaption,
  getMicroCopy,
  getCatDialoguePool,
  getEmptyIntentionHints,
  CAT_DIALOGUE_CONTEXTS,
} from './dialogue';
import { POSES, getPoseDefinition } from './poses';
import { CATS, getCatDefinition } from './cats';
import { OUTFITS, getOutfitDefinition } from './outfits';
import type { Mode, Status } from '@/features/timer/types';
import type { PoseId } from '@/features/cat/types';

describe('Dialogue Data & Loader', () => {
  it('passes comprehensive schema validation including cat dialogues', () => {
    expect(validateDialogueData(dialogueJson)).toBe(true);
  });

  describe('Session captions', () => {
    it('has keys for 0 through 12, each with >= 2 variants', () => {
      for (let i = 0; i <= 12; i++) {
        const pool = DIALOGUE_DATA.sessionCaptions[String(i)];
        expect(pool).toBeDefined();
        expect(pool!.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('all caption lines are under 60 characters and have no duplicates per pool', () => {
      for (let i = 0; i <= 12; i++) {
        const pool = DIALOGUE_DATA.sessionCaptions[String(i)]!;
        const seen = new Set<string>();

        pool.forEach(line => {
          expect(line.length).toBeLessThan(60);
          expect(seen.has(line)).toBe(false);
          seen.add(line);
        });
      }
    });
  });

  describe('Micro copy', () => {
    const modes: Mode[] = ['focus', 'shortBreak', 'longBreak'];
    const statuses: Status[] = ['idle', 'running', 'paused', 'finished'];

    it('has all 12 cells (3 modes x 4 statuses) with >= 4 variants each', () => {
      modes.forEach(mode => {
        statuses.forEach(status => {
          const pool = DIALOGUE_DATA.microCopy[mode][status];
          expect(pool).toBeDefined();
          expect(pool.length).toBeGreaterThanOrEqual(4);
        });
      });
    });

    it('all micro-copy lines are under 60 characters and have no duplicates per cell', () => {
      modes.forEach(mode => {
        statuses.forEach(status => {
          const pool = DIALOGUE_DATA.microCopy[mode][status];
          const seen = new Set<string>();

          pool.forEach(line => {
            expect(line.length).toBeLessThan(60);
            expect(seen.has(line)).toBe(false);
            seen.add(line);
          });
        });
      });
    });
  });

  describe('Cat companion dialogue', () => {
    it('covers all 17 contexts (including evening, click, welcomeBack) with >= 15 lines each', () => {
      expect(DIALOGUE_DATA.cat).toBeDefined();

      CAT_DIALOGUE_CONTEXTS.forEach(ctx => {
        const pool = DIALOGUE_DATA.cat![ctx];
        expect(pool).toBeDefined();
        expect(pool.length).toBeGreaterThanOrEqual(15);
      });

      // Specific tests for Phase 6 contexts
      const eveningPool = DIALOGUE_DATA.cat!.evening;
      expect(eveningPool.length).toBeGreaterThanOrEqual(15);

      const clickPool = DIALOGUE_DATA.cat!.click;
      expect(clickPool.length).toBeGreaterThanOrEqual(15);

      const welcomePool = DIALOGUE_DATA.cat!.welcomeBack;
      expect(welcomePool.length).toBeGreaterThanOrEqual(15);
      expect(welcomePool.some((line: string) => line.includes('🌷'))).toBe(true);

      const taskDonePool = DIALOGUE_DATA.cat!.taskDone;
      expect(taskDonePool.length).toBeGreaterThanOrEqual(15);
      expect(taskDonePool.some((line: string) => line.includes('✨'))).toBe(true);
    });

    it('all cat dialogue lines are under 60 characters with no duplicates in their pool', () => {
      CAT_DIALOGUE_CONTEXTS.forEach(ctx => {
        const pool = DIALOGUE_DATA.cat![ctx];
        const seen = new Set<string>();

        pool.forEach(line => {
          expect(line.length).toBeLessThan(60);
          expect(seen.has(line)).toBe(false);
          seen.add(line);
        });
      });
    });

    it('getCatDialoguePool returns valid non-empty array for all contexts', () => {
      CAT_DIALOGUE_CONTEXTS.forEach(ctx => {
        const pool = getCatDialoguePool(ctx);
        expect(pool.length).toBeGreaterThanOrEqual(15);
      });
    });

    it('intentions emptyHints has >= 6 gentle suggestion hints all under 60 chars', () => {
      const hints = getEmptyIntentionHints();
      expect(hints.length).toBeGreaterThanOrEqual(6);
      const seen = new Set<string>();
      hints.forEach(hint => {
        expect(hint.length).toBeLessThan(60);
        expect(seen.has(hint)).toBe(false);
        seen.add(hint);
      });
    });
  });

  describe('pickLine and stability', () => {
    const pool = ['Alpha', 'Bravo', 'Charlie', 'Delta'];

    it('returns the exact same line for the same seed', () => {
      const line1 = pickLine(pool, 'session-abc');
      const line2 = pickLine(pool, 'session-abc');
      expect(line1).toBe(line2);
    });

    it('distributes across variants with different seeds', () => {
      const results = new Set<string>();
      for (let i = 0; i < 20; i++) {
        results.add(pickLine(pool, `seed-${i}`));
      }
      expect(results.size).toBeGreaterThan(1);
    });

    it('handles empty pool safely', () => {
      expect(pickLine([], 'seed')).toBe('');
    });

    it('hashSeed produces non-negative integers', () => {
      expect(hashSeed('purrfocus')).toBeGreaterThanOrEqual(0);
      expect(hashSeed(42)).toBe(42);
      expect(hashSeed(-15)).toBe(15);
    });

    it('getSessionCaption and getMicroCopy return valid lines', () => {
      const cap = getSessionCaption(3, 'stable-seed');
      expect(cap).toBeTruthy();
      expect(cap.length).toBeLessThan(60);

      const copy = getMicroCopy('focus', 'running', 'stable-seed');
      expect(copy).toBeTruthy();
      expect(copy.length).toBeLessThan(60);
    });
  });

  describe('Cat manifests (poses, cats, outfits)', () => {
    it('POSES contains all 13 pose definitions with valid properties', () => {
      const poseIds: PoseId[] = [
        'idle_happy',
        'study_book',
        'study_write',
        'study_laptop',
        'break_tea',
        'break_nap',
        'stretch',
        'pet_happy',
        'play',
        'treat',
        'celebrate',
        'sleepy',
        'sad_gentle',
      ];

      poseIds.forEach(id => {
        const def = POSES[id];
        expect(def).toBeDefined();
        expect(def.id).toBe(id);
        expect(def.name).toBeTruthy();
        expect(def.caption).toBeTruthy();
        expect(def.alt).toBeTruthy();
        expect(def.src).toBeTruthy();
        expect(getPoseDefinition(id)).toEqual(def);
      });
    });

    it('CATS contains Mochi and Chai definitions', () => {
      expect(CATS.length).toBeGreaterThanOrEqual(2);
      expect(getCatDefinition('mochi').name).toBe('Mochi');
      expect(getCatDefinition('chai').name).toBe('Chai');
    });

    it('OUTFITS contains all outfits and resolves correctly', () => {
      expect(OUTFITS.length).toBeGreaterThanOrEqual(6);
      expect(getOutfitDefinition('none').name).toBe('Natural Fur');
      expect(getOutfitDefinition('glasses').name).toBe('Wire Glasses');
      expect(getOutfitDefinition(null).name).toBe('Natural Fur');
    });
  });
});
