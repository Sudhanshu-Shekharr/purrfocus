import { describe, it, expect } from 'vitest';
import {
  deriveBasePose,
  canTriggerOverlay,
  isPlayAllowed,
  shouldShowSadGentle,
  getOverlayDuration,
} from './machine';

describe('Cat State Machine (Pure Logic)', () => {
  describe('deriveBasePose', () => {
    it('focus + running maps to the chosen studyPoseVariant', () => {
      expect(deriveBasePose({ mode: 'focus', status: 'running', studyPoseVariant: 0 })).toBe('study_book');
      expect(deriveBasePose({ mode: 'focus', status: 'running', studyPoseVariant: 1 })).toBe('study_write');
      expect(deriveBasePose({ mode: 'focus', status: 'running', studyPoseVariant: 2 })).toBe('study_laptop');
    });

    it('focus + paused maps to idle_happy', () => {
      expect(deriveBasePose({ mode: 'focus', status: 'paused' })).toBe('idle_happy');
    });

    it('shortBreak + running or paused maps to break_tea', () => {
      expect(deriveBasePose({ mode: 'shortBreak', status: 'running' })).toBe('break_tea');
      expect(deriveBasePose({ mode: 'shortBreak', status: 'paused' })).toBe('break_tea');
    });

    it('longBreak + running or paused maps to break_nap', () => {
      expect(deriveBasePose({ mode: 'longBreak', status: 'running' })).toBe('break_nap');
      expect(deriveBasePose({ mode: 'longBreak', status: 'paused' })).toBe('break_nap');
    });

    it('idle mode maps to sleepy when isIdleSleepy is true, otherwise idle_happy', () => {
      expect(deriveBasePose({ mode: 'focus', status: 'idle' }, false)).toBe('idle_happy');
      expect(deriveBasePose({ mode: 'focus', status: 'idle' }, true)).toBe('sleepy');
      expect(deriveBasePose({ mode: 'shortBreak', status: 'idle' }, true)).toBe('sleepy');
    });

    it('finished status maps to idle_happy (overlay celebrate runs first)', () => {
      expect(deriveBasePose({ mode: 'focus', status: 'finished' })).toBe('idle_happy');
    });
  });

  describe('canTriggerOverlay & Precedence', () => {
    it('celebrate overlay cannot be interrupted by pet or treat', () => {
      expect(canTriggerOverlay('celebrate', 'pet_happy')).toBe(false);
      expect(canTriggerOverlay('celebrate', 'treat')).toBe(false);
    });

    it('celebrate overlay allows other priority events or replacing with another celebrate', () => {
      expect(canTriggerOverlay('celebrate', 'celebrate')).toBe(true);
      expect(canTriggerOverlay('celebrate', 'sad_gentle')).toBe(true);
    });

    it('pet and treat overlays can replace each other or idle', () => {
      expect(canTriggerOverlay(null, 'pet_happy')).toBe(true);
      expect(canTriggerOverlay('pet_happy', 'treat')).toBe(true);
      expect(canTriggerOverlay('treat', 'pet_happy')).toBe(true);
    });
  });

  describe('isPlayAllowed', () => {
    it('blocks play during active focus session', () => {
      expect(isPlayAllowed('running', 'focus')).toBe(false);
    });

    it('allows play when paused, idle, finished, or during breaks', () => {
      expect(isPlayAllowed('paused', 'focus')).toBe(true);
      expect(isPlayAllowed('idle', 'focus')).toBe(true);
      expect(isPlayAllowed('finished', 'focus')).toBe(true);
      expect(isPlayAllowed('running', 'shortBreak')).toBe(true);
      expect(isPlayAllowed('running', 'longBreak')).toBe(true);
    });
  });

  describe('shouldShowSadGentle', () => {
    it('shows sad_gentle only when reset happens from active focus session', () => {
      expect(shouldShowSadGentle('running', 'focus')).toBe(true);
      expect(shouldShowSadGentle('paused', 'focus')).toBe(true);
    });

    it('does not show sad_gentle when reset happens from idle, finished, or break modes', () => {
      expect(shouldShowSadGentle('idle', 'focus')).toBe(false);
      expect(shouldShowSadGentle('finished', 'focus')).toBe(false);
      expect(shouldShowSadGentle('running', 'shortBreak')).toBe(false);
      expect(shouldShowSadGentle('paused', 'longBreak')).toBe(false);
      expect(shouldShowSadGentle(null, null)).toBe(false);
    });
  });

  describe('getOverlayDuration', () => {
    it('returns exact configured durations in ms', () => {
      expect(getOverlayDuration('celebrate')).toBe(3000);
      expect(getOverlayDuration('sad_gentle')).toBe(2500);
      expect(getOverlayDuration('pet_happy')).toBe(2000);
      expect(getOverlayDuration('treat')).toBe(2500);
      expect(getOverlayDuration('stretch')).toBe(10000);
      expect(getOverlayDuration('play')).toBe(6000);
    });
  });
});
