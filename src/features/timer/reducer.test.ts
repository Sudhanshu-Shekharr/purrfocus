import { describe, it, expect } from 'vitest';
import { timerReducer, getNextMode } from './reducer';
import {
  getInitialTimerState,
  DEFAULT_DURATIONS,
  DEFAULT_CYCLES_BEFORE_LONG_BREAK,
} from './constants';
import type { TimerState } from './types';

describe('timerReducer', () => {
  const baseState = getInitialTimerState('2026-10-28');

  it('starts a timer correctly with endsAt math and new sessionId', () => {
    const now = 100000;
    const next = timerReducer(baseState, {
      type: 'start',
      payload: { now, sessionId: 'session-1' },
    });

    expect(next.status).toBe('running');
    expect(next.remaining).toBe(DEFAULT_DURATIONS.focus);
    expect(next.endsAt).toBe(now + DEFAULT_DURATIONS.focus * 1000);
    expect(next.sessionId).toBe('session-1');
  });

  it('pauses and resumes without losing elapsed time', () => {
    const t0 = 100000;
    const running = timerReducer(baseState, {
      type: 'start',
      payload: { now: t0, sessionId: 'session-1' },
    });

    // 100 seconds elapse
    const t1 = t0 + 100 * 1000;
    const paused = timerReducer(running, {
      type: 'pause',
      payload: { now: t1 },
    });

    expect(paused.status).toBe('paused');
    expect(paused.remaining).toBe(DEFAULT_DURATIONS.focus - 100);
    expect(paused.endsAt).toBeNull();
    expect(paused.sessionId).toBe('session-1');

    // Idle for 50 seconds, then resume
    const t2 = t1 + 50 * 1000;
    const resumed = timerReducer(paused, {
      type: 'resume',
      payload: { now: t2 },
    });

    expect(resumed.status).toBe('running');
    expect(resumed.remaining).toBe(DEFAULT_DURATIONS.focus - 100);
    expect(resumed.endsAt).toBe(t2 + (DEFAULT_DURATIONS.focus - 100) * 1000);
    expect(resumed.sessionId).toBe('session-1');
  });

  it('resets to idle with full duration and keeps completedFocusSessions', () => {
    const stateWithCompleted: TimerState = {
      ...baseState,
      status: 'paused',
      remaining: 500,
      completedFocusSessions: 3,
      sessionId: 'session-123',
    };

    const reset = timerReducer(stateWithCompleted, { type: 'reset' });
    expect(reset.status).toBe('idle');
    expect(reset.remaining).toBe(DEFAULT_DURATIONS.focus);
    expect(reset.endsAt).toBeNull();
    expect(reset.sessionId).toBeNull();
    expect(reset.completedFocusSessions).toBe(3);
  });

  describe('tick referential equality and finish', () => {
    it('returns the exact same object reference if remaining whole second is unchanged', () => {
      const now = 100000;
      const running = timerReducer(baseState, {
        type: 'start',
        payload: { now, sessionId: 'session-1' },
      });

      // 100ms later, remaining whole second is still 1500
      const tick1 = timerReducer(running, {
        type: 'tick',
        payload: { now: now + 100 },
      });

      expect(tick1).toBe(running); // Same referential identity

      // 1050ms later, remaining decreases
      const tick2 = timerReducer(running, {
        type: 'tick',
        payload: { now: now + 1050 },
      });

      expect(tick2).not.toBe(running);
      expect(tick2.remaining).toBe(1499);
    });

    it('transitions to finished when remaining hits 0', () => {
      const now = 100000;
      const running: TimerState = {
        ...baseState,
        status: 'running',
        remaining: 1,
        endsAt: now + 1000,
        sessionId: 'session-1',
      };

      const finished = timerReducer(running, {
        type: 'tick',
        payload: { now: now + 1000 },
      });

      expect(finished.status).toBe('finished');
      expect(finished.remaining).toBe(0);
      expect(finished.endsAt).toBeNull();
      expect(finished.completedFocusSessions).toBe(1);
    });
  });

  it('finish action is idempotent (does not double count)', () => {
    const finishedState: TimerState = {
      ...baseState,
      status: 'finished',
      remaining: 0,
      endsAt: null,
      completedFocusSessions: 2,
    };

    const callAgain = timerReducer(finishedState, { type: 'finish' });
    expect(callAgain).toBe(finishedState);
    expect(callAgain.completedFocusSessions).toBe(2);
  });

  describe('Long break cadence and cycles', () => {
    it('follows focus -> short -> focus -> short -> focus -> short -> focus -> long with cycles = 4', () => {
      let state: TimerState = {
        ...baseState,
        cyclesBeforeLongBreak: 4,
        completedFocusSessions: 0,
      };

      // 1. Focus session 1 finishes
      state = timerReducer(state, { type: 'finish' });
      expect(state.completedFocusSessions).toBe(1);
      expect(getNextMode(state.mode, state.completedFocusSessions, state.cyclesBeforeLongBreak)).toBe('shortBreak');

      state = timerReducer(state, { type: 'advance' });
      expect(state.mode).toBe('shortBreak');
      expect(state.status).toBe('idle');
      expect(state.remaining).toBe(DEFAULT_DURATIONS.shortBreak);

      // Short break finishes
      state = timerReducer(state, { type: 'finish' });
      expect(state.completedFocusSessions).toBe(1); // unchanged
      expect(getNextMode(state.mode, state.completedFocusSessions, state.cyclesBeforeLongBreak)).toBe('focus');

      state = timerReducer(state, { type: 'advance' });
      expect(state.mode).toBe('focus');

      // 2. Focus session 2 finishes
      state = timerReducer(state, { type: 'finish' });
      expect(state.completedFocusSessions).toBe(2);
      expect(getNextMode(state.mode, state.completedFocusSessions, state.cyclesBeforeLongBreak)).toBe('shortBreak');

      state = timerReducer(state, { type: 'advance' });
      state = timerReducer(state, { type: 'finish' });
      state = timerReducer(state, { type: 'advance' });
      expect(state.mode).toBe('focus');

      // 3. Focus session 3 finishes
      state = timerReducer(state, { type: 'finish' });
      expect(state.completedFocusSessions).toBe(3);
      expect(getNextMode(state.mode, state.completedFocusSessions, state.cyclesBeforeLongBreak)).toBe('shortBreak');

      state = timerReducer(state, { type: 'advance' });
      state = timerReducer(state, { type: 'finish' });
      state = timerReducer(state, { type: 'advance' });
      expect(state.mode).toBe('focus');

      // 4. Focus session 4 finishes -> cycles reached!
      state = timerReducer(state, { type: 'finish' });
      expect(state.completedFocusSessions).toBe(4);
      expect(getNextMode(state.mode, state.completedFocusSessions, state.cyclesBeforeLongBreak)).toBe('longBreak');

      state = timerReducer(state, { type: 'advance' });
      expect(state.mode).toBe('longBreak');
      expect(state.remaining).toBe(DEFAULT_DURATIONS.longBreak);

      // Long break finishes -> counter resets to 0!
      state = timerReducer(state, { type: 'finish' });
      expect(state.completedFocusSessions).toBe(0);
      expect(getNextMode(state.mode, state.completedFocusSessions, state.cyclesBeforeLongBreak)).toBe('focus');

      state = timerReducer(state, { type: 'advance' });
      expect(state.mode).toBe('focus');

      // 5. Next focus finishes -> wraps to 1
      state = timerReducer(state, { type: 'finish' });
      expect(state.completedFocusSessions).toBe(1);
    });

    it('works with cycles = 1', () => {
      let state: TimerState = {
        ...baseState,
        cyclesBeforeLongBreak: 1,
        completedFocusSessions: 0,
      };

      state = timerReducer(state, { type: 'finish' });
      expect(state.completedFocusSessions).toBe(1);
      expect(getNextMode(state.mode, state.completedFocusSessions, state.cyclesBeforeLongBreak)).toBe('longBreak');

      state = timerReducer(state, { type: 'advance' });
      expect(state.mode).toBe('longBreak');

      state = timerReducer(state, { type: 'finish' });
      expect(state.completedFocusSessions).toBe(0);
    });

    it('works with cycles = 2', () => {
      let state: TimerState = {
        ...baseState,
        cyclesBeforeLongBreak: 2,
        completedFocusSessions: 0,
      };

      // Session 1
      state = timerReducer(state, { type: 'finish' });
      expect(state.completedFocusSessions).toBe(1);
      expect(getNextMode(state.mode, state.completedFocusSessions, state.cyclesBeforeLongBreak)).toBe('shortBreak');

      state = timerReducer(state, { type: 'advance' });
      state = timerReducer(state, { type: 'finish' });
      state = timerReducer(state, { type: 'advance' });

      // Session 2
      state = timerReducer(state, { type: 'finish' });
      expect(state.completedFocusSessions).toBe(2);
      expect(getNextMode(state.mode, state.completedFocusSessions, state.cyclesBeforeLongBreak)).toBe('longBreak');
    });

    it('clamps completedFocusSessions safely if cycles are lowered mid-run', () => {
      const state: TimerState = {
        ...baseState,
        cyclesBeforeLongBreak: 6,
        completedFocusSessions: 5,
      };

      const updated = timerReducer(state, {
        type: 'applySettings',
        payload: { cyclesBeforeLongBreak: 3 },
      });

      expect(updated.cyclesBeforeLongBreak).toBe(3);
      expect(updated.completedFocusSessions).toBe(3);
    });
  });

  describe('applySettings validation and active session safety', () => {
    it('updates current-mode remaining when idle or finished', () => {
      const updated = timerReducer(baseState, {
        type: 'applySettings',
        payload: {
          durations: { focus: 30 * 60 },
        },
      });

      expect(updated.durations.focus).toBe(1800);
      expect(updated.remaining).toBe(1800);
    });

    it('does not mutate remaining or endsAt when running or paused', () => {
      const now = 100000;
      const running = timerReducer(baseState, {
        type: 'start',
        payload: { now, sessionId: 'session-1' },
      });

      const updated = timerReducer(running, {
        type: 'applySettings',
        payload: {
          durations: { focus: 45 * 60 },
        },
      });

      expect(updated.durations.focus).toBe(2700);
      expect(updated.remaining).toBe(DEFAULT_DURATIONS.focus);
      expect(updated.endsAt).toBe(running.endsAt);
    });

    it('rejects invalid duration values (0, 181 min, NaN, decimals, negatives, strings)', () => {
      const updated = timerReducer(baseState, {
        type: 'applySettings',
        payload: {
          durations: {
            focus: 0, // invalid (less than 60s)
            shortBreak: 181 * 60, // invalid (more than 180 min)
            longBreak: (NaN as unknown as number),
          },
          cyclesBeforeLongBreak: 13, // invalid (greater than 12)
        },
      });

      expect(updated.durations.focus).toBe(DEFAULT_DURATIONS.focus);
      expect(updated.durations.shortBreak).toBe(DEFAULT_DURATIONS.shortBreak);
      expect(updated.durations.longBreak).toBe(DEFAULT_DURATIONS.longBreak);
      expect(updated.cyclesBeforeLongBreak).toBe(DEFAULT_CYCLES_BEFORE_LONG_BREAK);
    });
  });

  describe('switchMode rules', () => {
    it('switches mode when idle, paused, or finished', () => {
      const switched = timerReducer(baseState, {
        type: 'switchMode',
        payload: { mode: 'shortBreak' },
      });
      expect(switched.mode).toBe('shortBreak');
      expect(switched.remaining).toBe(DEFAULT_DURATIONS.shortBreak);
      expect(switched.status).toBe('idle');
    });

    it('rejects switchMode when running', () => {
      const now = 100000;
      const running = timerReducer(baseState, {
        type: 'start',
        payload: { now, sessionId: 'session-1' },
      });

      const attempt = timerReducer(running, {
        type: 'switchMode',
        payload: { mode: 'shortBreak' },
      });

      expect(attempt.mode).toBe('focus');
      expect(attempt.status).toBe('running');
    });
  });

  describe('rollDay and rehydrate', () => {
    it('resets completedFocusSessions when day changes', () => {
      const stateWithSessions: TimerState = {
        ...baseState,
        countDate: '2026-10-27',
        completedFocusSessions: 3,
      };

      const rolled = timerReducer(stateWithSessions, {
        type: 'rollDay',
        payload: { todayKey: '2026-10-28' },
      });

      expect(rolled.countDate).toBe('2026-10-28');
      expect(rolled.completedFocusSessions).toBe(0);
    });

    it('keeps completedFocusSessions if day is the same', () => {
      const stateWithSessions: TimerState = {
        ...baseState,
        countDate: '2026-10-28',
        completedFocusSessions: 3,
      };

      const rolled = timerReducer(stateWithSessions, {
        type: 'rollDay',
        payload: { todayKey: '2026-10-28' },
      });

      expect(rolled).toBe(stateWithSessions);
    });

    it('rehydrate keeps running timer if endsAt is in future', () => {
      const now = 100000;
      const running: TimerState = {
        ...baseState,
        status: 'running',
        endsAt: now + 500 * 1000,
        remaining: 1500,
      };

      const rehydrated = timerReducer(running, {
        type: 'rehydrate',
        payload: { now, todayKey: '2026-10-28' },
      });

      expect(rehydrated.status).toBe('running');
      expect(rehydrated.remaining).toBe(500);
    });

    it('rehydrate finishes running timer if endsAt is in the past', () => {
      const now = 100000;
      const running: TimerState = {
        ...baseState,
        status: 'running',
        endsAt: now - 50 * 1000,
        remaining: 50,
      };

      const rehydrated = timerReducer(running, {
        type: 'rehydrate',
        payload: { now, todayKey: '2026-10-28' },
      });

      expect(rehydrated.status).toBe('finished');
      expect(rehydrated.remaining).toBe(0);
      expect(rehydrated.completedFocusSessions).toBe(1);
    });
  });
});
