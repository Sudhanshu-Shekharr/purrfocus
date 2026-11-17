import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useCatRuntimeStore,
  selectDisplayedPose,
  selectMood,
  selectEyebrow,
  initCatController,
  destroyCatController,
} from './controller';
import { useCatStore } from './store';
import { useTimerStore } from '@/features/timer/store';
import { emitTimerEvent } from '@/features/timer/events';
import { OVERLAY_DURATIONS, COOLDOWNS, IDLE_SLEEPY_MS } from './constants';
import { getCatLines } from './lines';

describe('Cat Controller & Runtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    destroyCatController();
    useCatRuntimeStore.getState().resetRuntime();
    useCatStore.getState().resetCat();
    useTimerStore.getState().reset();
  });

  afterEach(() => {
    destroyCatController();
    vi.useRealTimers();
  });

  describe('selectDisplayedPose', () => {
    it('returns overlay pose while overlay is active', () => {
      const now = 1000;
      const overlay = { type: 'pet_happy' as const, pose: 'pet_happy' as const, until: now + 500 };
      expect(selectDisplayedPose(overlay, false, 'focus', 'running', 0, now)).toBe('pet_happy');
    });

    it('returns base pose once overlay expires', () => {
      const now = 2000;
      const overlay = { type: 'pet_happy' as const, pose: 'pet_happy' as const, until: now - 10 };
      expect(selectDisplayedPose(overlay, false, 'focus', 'running', 0, now)).toBe('study_book');
    });

    it('returns sleepy when isSleeping is true and timer status is idle', () => {
      expect(selectDisplayedPose(null, true, 'focus', 'idle', 0)).toBe('sleepy');
    });

    it('does not return sleepy if timer is running', () => {
      expect(selectDisplayedPose(null, true, 'focus', 'running', 0)).toBe('study_book');
    });

    it('derives correct study pose variant', () => {
      expect(selectDisplayedPose(null, false, 'focus', 'running', 0)).toBe('study_book');
      expect(selectDisplayedPose(null, false, 'focus', 'running', 1)).toBe('study_write');
      expect(selectDisplayedPose(null, false, 'focus', 'running', 2)).toBe('study_laptop');
    });

    it('derives break tea and break nap poses', () => {
      expect(selectDisplayedPose(null, false, 'shortBreak', 'running', 0)).toBe('break_tea');
      expect(selectDisplayedPose(null, false, 'longBreak', 'running', 0)).toBe('break_nap');
    });
  });

  describe('selectMood', () => {
    it('derives proud during celebrate', () => {
      expect(selectMood('celebrate', 'focus', 'finished')).toBe('proud');
    });

    it('derives focused during running focus', () => {
      expect(selectMood('study_book', 'focus', 'running')).toBe('focused');
    });

    it('derives cozy during break', () => {
      expect(selectMood('break_tea', 'shortBreak', 'running')).toBe('cozy');
      expect(selectMood('break_nap', 'longBreak', 'running')).toBe('cozy');
    });

    it('derives sleepy when posed sleepy', () => {
      expect(selectMood('sleepy', 'focus', 'idle')).toBe('sleepy');
    });

    it('defaults to happy for idle or pet', () => {
      expect(selectMood('idle_happy', 'focus', 'idle')).toBe('happy');
      expect(selectMood('pet_happy', 'focus', 'idle')).toBe('happy');
    });
  });

  describe('selectEyebrow', () => {
    it('returns STUDYING TOGETHER with pulsing when running focus', () => {
      expect(selectEyebrow('focus', 'running')).toEqual({
        label: 'STUDYING TOGETHER',
        pulsing: true,
      });
    });

    it('returns STUDYING TOGETHER without pulsing when paused focus', () => {
      expect(selectEyebrow('focus', 'paused')).toEqual({
        label: 'STUDYING TOGETHER',
        pulsing: false,
      });
    });

    it('returns TAKING A BREAK when in break', () => {
      expect(selectEyebrow('shortBreak', 'running')).toEqual({
        label: 'TAKING A BREAK',
        pulsing: true,
      });
    });

    it('returns READY WHEN YOU ARE when idle', () => {
      expect(selectEyebrow('focus', 'idle')).toEqual({
        label: 'READY WHEN YOU ARE',
        pulsing: false,
      });
    });
  });

  describe('Pet action', () => {
    it('triggers pet_happy overlay and enforces cooldown', () => {
      const now = 10_000;
      const success1 = useCatRuntimeStore.getState().pet(now);
      expect(success1).toBe(true);

      const overlay = useCatRuntimeStore.getState().overlay;
      expect(overlay?.type).toBe('pet_happy');
      expect(overlay?.pose).toBe('pet_happy');
      expect(overlay?.until).toBe(now + OVERLAY_DURATIONS.pet_happy);

      // Cooldown is 1500ms
      const success2 = useCatRuntimeStore.getState().pet(now + 500);
      expect(success2).toBe(false);

      const success3 = useCatRuntimeStore.getState().pet(now + COOLDOWNS.pet + 10);
      expect(success3).toBe(true);
    });

    it('clears overlay after duration', () => {
      const now = 10_000;
      useCatRuntimeStore.getState().pet(now);
      expect(useCatRuntimeStore.getState().overlay).not.toBeNull();

      vi.advanceTimersByTime(OVERLAY_DURATIONS.pet_happy);
      expect(useCatRuntimeStore.getState().overlay).toBeNull();
    });
  });

  describe('Treat action', () => {
    it('triggers treat overlay and enforces cooldown', () => {
      const now = 20_000;
      const success1 = useCatRuntimeStore.getState().treat(now);
      expect(success1).toBe(true);
      expect(useCatRuntimeStore.getState().overlay?.type).toBe('treat');

      // Cooldown is 10000ms
      const success2 = useCatRuntimeStore.getState().treat(now + 2000);
      expect(success2).toBe(false);

      const success3 = useCatRuntimeStore.getState().treat(now + COOLDOWNS.treat + 10);
      expect(success3).toBe(true);
    });
  });

  describe('Play action', () => {
    it('is blocked during active running focus and sets warning bubble', () => {
      useTimerStore.setState({ status: 'running', mode: 'focus' });

      const success = useCatRuntimeStore.getState().play();
      expect(success).toBe(false);
      expect(useCatRuntimeStore.getState().overlay).toBeNull();
      expect(useCatRuntimeStore.getState().playActive).toBe(false);
      expect(getCatLines('playBlockedFocus')).toContain(useCatRuntimeStore.getState().currentLine);
    });

    it('is allowed during idle or break and sets playActive', () => {
      useTimerStore.setState({ status: 'idle', mode: 'focus' });

      const now = 30_000;
      const success = useCatRuntimeStore.getState().play(now);
      expect(success).toBe(true);
      expect(useCatRuntimeStore.getState().playActive).toBe(true);
      expect(useCatRuntimeStore.getState().overlay?.type).toBe('play');

      // stopPlay clears it early
      useCatRuntimeStore.getState().stopPlay();
      expect(useCatRuntimeStore.getState().playActive).toBe(false);
      expect(useCatRuntimeStore.getState().overlay).toBeNull();
    });
  });

  describe('Stretch action', () => {
    it('triggers stretch overlay and decrements countdown', () => {
      const now = 40_000;
      const success = useCatRuntimeStore.getState().stretch(now);
      expect(success).toBe(true);
      expect(useCatRuntimeStore.getState().stretchRemaining).toBe(10);

      vi.advanceTimersByTime(2000);
      expect(useCatRuntimeStore.getState().stretchRemaining).toBe(8);

      vi.advanceTimersByTime(8000);
      expect(useCatRuntimeStore.getState().stretchRemaining).toBeNull();
    });
  });

  describe('Timer events integration & celebrate non-interruption', () => {
    it('awards focus bond and triggers celebrate overlay on focus finish', () => {
      initCatController();
      useTimerStore.setState({ durations: { focus: 1500, shortBreak: 300, longBreak: 900 } });

      emitTimerEvent({
        type: 'finish',
        mode: 'focus',
        completedFocusSessions: 1,
      });

      // 1500s = 25 minutes -> 25 bond points
      expect(useCatStore.getState().bond).toBe(25);
      expect(useCatRuntimeStore.getState().overlay?.type).toBe('celebrate');

      // While celebrate is active, Pet cannot interrupt it!
      const petAttempt = useCatRuntimeStore.getState().pet();
      expect(petAttempt).toBe(false);
      expect(useCatRuntimeStore.getState().overlay?.type).toBe('celebrate');

      // Advance 3s -> celebrate expires
      vi.advanceTimersByTime(OVERLAY_DURATIONS.celebrate);
      expect(useCatRuntimeStore.getState().overlay).toBeNull();
    });

    it('triggers sad_gentle on timer reset mid-session', () => {
      initCatController();

      // Simulate timer running in focus mode
      useTimerStore.setState({ status: 'running', mode: 'focus' });
      vi.advanceTimersByTime(100);

      // User resets mid-session
      emitTimerEvent({
        type: 'reset',
        mode: 'focus',
        completedFocusSessions: 0,
      });

      expect(useCatRuntimeStore.getState().overlay?.type).toBe('sad_gentle');

      vi.advanceTimersByTime(OVERLAY_DURATIONS.sad_gentle);
      expect(useCatRuntimeStore.getState().overlay).toBeNull();
    });
  });

  describe('Idle Sleepy Mechanics', () => {
    it('sets isSleeping to true after 2 minutes of idle time', () => {
      useTimerStore.setState({ status: 'idle', mode: 'focus' });
      initCatController();

      expect(useCatRuntimeStore.getState().isSleeping).toBe(false);

      vi.advanceTimersByTime(IDLE_SLEEPY_MS);
      expect(useCatRuntimeStore.getState().isSleeping).toBe(true);

      // User activity wakes the cat
      useCatRuntimeStore.getState().handleUserActivity();
      expect(useCatRuntimeStore.getState().isSleeping).toBe(false);
    });
  });
});
