import { describe, it, expect } from 'vitest';
import {
  getBondLevel,
  getBondLevelLabel,
  isOutfitUnlocked,
  getNextLevelInfo,
} from './bond';

describe('Bond Calculations & Unlock Rules', () => {
  it('correctly maps points to bond levels at exact boundaries', () => {
    expect(getBondLevel(0)).toBe('stranger');
    expect(getBondLevel(19)).toBe('stranger');
    expect(getBondLevel(20)).toBe('friend');
    expect(getBondLevel(59)).toBe('friend');
    expect(getBondLevel(60)).toBe('best_friend');
    expect(getBondLevel(149)).toBe('best_friend');
    expect(getBondLevel(150)).toBe('family');
    expect(getBondLevel(300)).toBe('family');
  });

  it('handles negative or decimal points safely', () => {
    expect(getBondLevel(-10)).toBe('stranger');
    expect(getBondLevel(19.9)).toBe('stranger');
    expect(getBondLevel(20.1)).toBe('friend');
  });

  it('formats level labels for UI display', () => {
    expect(getBondLevelLabel('stranger')).toBe('Stranger');
    expect(getBondLevelLabel('friend')).toBe('Friend');
    expect(getBondLevelLabel('best_friend')).toBe('Best friend');
    expect(getBondLevelLabel('family')).toBe('Family');
  });

  it('evaluates outfit unlocks based on tier thresholds', () => {
    // Friend tier outfits (threshold 20)
    expect(isOutfitUnlocked('friend', 15)).toBe(false);
    expect(isOutfitUnlocked('friend', 20)).toBe(true);
    expect(isOutfitUnlocked('friend', 65)).toBe(true);

    // Best friend tier outfits (threshold 60)
    expect(isOutfitUnlocked('best_friend', 59)).toBe(false);
    expect(isOutfitUnlocked('best_friend', 60)).toBe(true);

    // Family tier outfits (threshold 150)
    expect(isOutfitUnlocked('family', 149)).toBe(false);
    expect(isOutfitUnlocked('family', 150)).toBe(true);
  });

  it('computes next level progress and points needed accurately', () => {
    // Stranger at 10 points (needs 10 more to reach 20 for Friend)
    const info1 = getNextLevelInfo(10);
    expect(info1.currentLevel).toBe('stranger');
    expect(info1.nextLevel).toBe('friend');
    expect(info1.pointsToNext).toBe(10);
    expect(info1.progressPercent).toBe(50);

    // Friend at 40 points (needs 20 more to reach 60 for Best Friend; (40-20)/(60-20) = 50%)
    const info2 = getNextLevelInfo(40);
    expect(info2.currentLevel).toBe('friend');
    expect(info2.nextLevel).toBe('best_friend');
    expect(info2.pointsToNext).toBe(20);
    expect(info2.progressPercent).toBe(50);

    // Max tier (Family)
    const info3 = getNextLevelInfo(200);
    expect(info3.currentLevel).toBe('family');
    expect(info3.nextLevel).toBeNull();
    expect(info3.pointsToNext).toBe(0);
    expect(info3.progressPercent).toBe(100);
  });
});
