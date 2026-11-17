import { describe, it, expect } from 'vitest';
import {
  shouldTriggerRareEvent,
  RARE_EVENT_CONSTANTS,
  type ShouldTriggerParams,
} from './rareEvents';

describe('Rare Events Logic', () => {
  const baseParams: ShouldTriggerParams = {
    timerStatus: 'idle',
    timerMode: 'focus',
    rareEventsOn: true,
    reducedMotion: false,
    hasActiveEvent: false,
    lastEventTime: 0,
    now: 1_000_000_000,
    randomValue: 0.05, // < 0.12
    sceneId: 'scene5', // Sunlit Studio has butterfly, leafDrift, birdChirp
  };

  it('triggers an event when all conditions are satisfied', () => {
    const result = shouldTriggerRareEvent(baseParams);
    expect(result).not.toBeNull();
    expect(['butterfly', 'leafDrift', 'birdChirp']).toContain(result);
  });

  it('Quiet Focus Rule: suppresses events while timer is running in focus mode', () => {
    const result = shouldTriggerRareEvent({
      ...baseParams,
      timerStatus: 'running',
      timerMode: 'focus',
    });
    expect(result).toBeNull();
  });

  it('allows events during breaks even when timer is running', () => {
    const resultShort = shouldTriggerRareEvent({
      ...baseParams,
      timerStatus: 'running',
      timerMode: 'shortBreak',
    });
    expect(resultShort).not.toBeNull();

    const resultLong = shouldTriggerRareEvent({
      ...baseParams,
      timerStatus: 'running',
      timerMode: 'longBreak',
    });
    expect(resultLong).not.toBeNull();
  });

  it('enforces 10-minute cooldown between events', () => {
    const now = 1_000_000_000;
    const withinCooldown = shouldTriggerRareEvent({
      ...baseParams,
      now,
      lastEventTime: now - (RARE_EVENT_CONSTANTS.COOLDOWN_MS - 1000), // 9m59s
    });
    expect(withinCooldown).toBeNull();

    const pastCooldown = shouldTriggerRareEvent({
      ...baseParams,
      now,
      lastEventTime: now - RARE_EVENT_CONSTANTS.COOLDOWN_MS, // exactly 10m
    });
    expect(pastCooldown).not.toBeNull();
  });

  it('enforces max 1 active event at a time', () => {
    const result = shouldTriggerRareEvent({
      ...baseParams,
      hasActiveEvent: true,
    });
    expect(result).toBeNull();
  });

  it('suppresses events when rareEventsOn is false', () => {
    const result = shouldTriggerRareEvent({
      ...baseParams,
      rareEventsOn: false,
    });
    expect(result).toBeNull();
  });

  it('suppresses events when reducedMotion is true', () => {
    const result = shouldTriggerRareEvent({
      ...baseParams,
      reducedMotion: true,
    });
    expect(result).toBeNull();
  });

  it('suppresses events when random value exceeds probability threshold (12%)', () => {
    const result = shouldTriggerRareEvent({
      ...baseParams,
      randomValue: 0.13, // >= 0.12
    });
    expect(result).toBeNull();
  });

  it('returns null for scenes with no rare events configured', () => {
    const result = shouldTriggerRareEvent({
      ...baseParams,
      sceneId: 'scene3', // Late reading has empty array
    });
    expect(result).toBeNull();
  });
});
