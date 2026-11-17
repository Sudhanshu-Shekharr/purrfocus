import { describe, it, expect } from 'vitest';
import { computeUnlocked, computeTotalFocusMinutes } from './unlocks';

describe('Collectibles Unlock Logic', () => {
  it('computes total focus minutes from session logs', () => {
    const logs = [{ minutes: 25 }, { minutes: 25 }, { minutes: 10 }];
    expect(computeTotalFocusMinutes(logs)).toBe(60);
  });

  it('returns empty array when thresholds are not met', () => {
    const logs = [{ minutes: 25 }];
    const unlocked = computeUnlocked(logs, { current: 1, lastActiveDay: null, gapDays: 0 });
    expect(unlocked).toEqual([]);
  });

  it('unlocks tea-mug at 60 minutes', () => {
    const logs = [{ minutes: 60 }];
    const unlocked = computeUnlocked(logs, 0);
    expect(unlocked).toContain('tea-mug');
    expect(unlocked).not.toContain('plant');
  });

  it('unlocks plant at 120 minutes', () => {
    const logs = [{ minutes: 120 }];
    const unlocked = computeUnlocked(logs, 0);
    expect(unlocked).toContain('tea-mug');
    expect(unlocked).toContain('plant');
    expect(unlocked).not.toContain('lamp');
  });

  it('unlocks lamp at 240 minutes', () => {
    const logs = [{ minutes: 240 }];
    const unlocked = computeUnlocked(logs, 0);
    expect(unlocked).toContain('tea-mug');
    expect(unlocked).toContain('plant');
    expect(unlocked).toContain('lamp');
    expect(unlocked).not.toContain('photo-frame');
  });

  it('unlocks photo-frame at 480 minutes', () => {
    const logs = [{ minutes: 480 }];
    const unlocked = computeUnlocked(logs, 0);
    expect(unlocked).toContain('tea-mug');
    expect(unlocked).toContain('plant');
    expect(unlocked).toContain('lamp');
    expect(unlocked).toContain('photo-frame');
  });

  it('unlocks bookmark at a 3-day streak regardless of minutes', () => {
    const logs = [{ minutes: 10 }]; // Under 60m
    const unlocked = computeUnlocked(logs, 3);
    expect(unlocked).toContain('bookmark');
    expect(unlocked).not.toContain('tea-mug');
  });

  it('unlocks all collectibles when all thresholds and streak are met', () => {
    const logs = [{ minutes: 500 }];
    const unlocked = computeUnlocked(logs, { current: 5, lastActiveDay: '2026-10-29', gapDays: 0 });
    expect(unlocked).toEqual(['tea-mug', 'plant', 'lamp', 'photo-frame', 'bookmark']);
  });
});
