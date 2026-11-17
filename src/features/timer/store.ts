import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Mode, Status, TimerAction, TimerDurations, TimerState } from './types';
import {
  DEFAULT_DURATIONS,
  DEFAULT_CYCLES_BEFORE_LONG_BREAK,
  MIN_DURATION_SECONDS,
  MAX_DURATION_SECONDS,
  MIN_CYCLES,
  MAX_CYCLES,
  getInitialTimerState,
  getTodayDateString,
} from './constants';
import { timerReducer } from './reducer';
import { emitTimerEvent } from './events';

export type TimerStore = TimerState & {
  dispatch: (action: TimerAction) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: (now?: number) => void;
  finish: () => void;
  advance: () => void;
  switchMode: (mode: Mode) => void;
  applySettings: (settings: {
    durations?: Partial<TimerDurations>;
    cyclesBeforeLongBreak?: number;
    autoStartNext?: boolean;
    chimeOnFinish?: boolean;
  }) => void;
  rollDay: (todayKey?: string) => void;
  rehydrate: (now?: number, todayKey?: string) => void;
};

export function sanitizeTimerState(persisted: unknown): TimerState {
  const state = persisted as Partial<TimerState> | undefined;
  const todayKey = getTodayDateString();
  const defaultState = getInitialTimerState(todayKey);

  if (!state || typeof state !== 'object') {
    return defaultState;
  }

  const validModes: Mode[] = ['focus', 'shortBreak', 'longBreak'];
  const mode: Mode = validModes.includes(state.mode as Mode)
    ? (state.mode as Mode)
    : 'focus';

  const validStatuses: Status[] = ['idle', 'running', 'paused', 'finished'];
  let status: Status = validStatuses.includes(state.status as Status)
    ? (state.status as Status)
    : 'idle';

  const durations: TimerDurations = { ...DEFAULT_DURATIONS };
  if (state.durations && typeof state.durations === 'object') {
    for (const m of validModes) {
      const dur = state.durations[m];
      if (
        typeof dur === 'number' &&
        Number.isInteger(dur) &&
        dur >= MIN_DURATION_SECONDS &&
        dur <= MAX_DURATION_SECONDS
      ) {
        durations[m] = dur;
      }
    }
  }

  const cycles =
    typeof state.cyclesBeforeLongBreak === 'number' &&
    Number.isInteger(state.cyclesBeforeLongBreak) &&
    state.cyclesBeforeLongBreak >= MIN_CYCLES &&
    state.cyclesBeforeLongBreak <= MAX_CYCLES
      ? state.cyclesBeforeLongBreak
      : DEFAULT_CYCLES_BEFORE_LONG_BREAK;

  let completed =
    typeof state.completedFocusSessions === 'number' &&
    Number.isInteger(state.completedFocusSessions) &&
    state.completedFocusSessions >= 0
      ? Math.min(state.completedFocusSessions, cycles)
      : 0;

  const countDate =
    typeof state.countDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(state.countDate)
      ? state.countDate
      : todayKey;

  if (countDate !== todayKey) {
    completed = 0;
  }

  const autoStartNext =
    typeof state.autoStartNext === 'boolean' ? state.autoStartNext : false;
  const chimeOnFinish =
    typeof state.chimeOnFinish === 'boolean' ? state.chimeOnFinish : true;
  const sessionId = typeof state.sessionId === 'string' ? state.sessionId : null;

  const endsAt = typeof state.endsAt === 'number' ? state.endsAt : null;
  let remaining =
    typeof state.remaining === 'number' && state.remaining >= 0
      ? state.remaining
      : durations[mode];

  if (status === 'running' && endsAt === null) {
    status = 'idle';
    remaining = durations[mode];
  }

  return {
    mode,
    status,
    durations,
    remaining,
    endsAt,
    completedFocusSessions: completed,
    cyclesBeforeLongBreak: cycles,
    autoStartNext,
    chimeOnFinish,
    countDate,
    sessionId,
  };
}

export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      ...getInitialTimerState(),

      dispatch: (action: TimerAction) => {
        const prevState = get();
        const nextState = timerReducer(prevState, action);
        if (nextState !== prevState) {
          set(nextState);
        }
      },

      start: () => {
        const now = Date.now();
        const sessionId = generateSessionId();
        const prevState = get();
        get().dispatch({ type: 'start', payload: { now, sessionId } });
        const nextState = get();
        if (nextState.status === 'running' && prevState.status !== 'running') {
          emitTimerEvent({
            type: 'start',
            mode: nextState.mode,
            completedFocusSessions: nextState.completedFocusSessions,
          });
        }
      },

      pause: () => {
        const now = Date.now();
        const prevState = get();
        get().dispatch({ type: 'pause', payload: { now } });
        const nextState = get();
        if (nextState.status === 'paused' && prevState.status === 'running') {
          emitTimerEvent({
            type: 'pause',
            mode: nextState.mode,
            completedFocusSessions: nextState.completedFocusSessions,
          });
        }
      },

      resume: () => {
        const now = Date.now();
        const prevState = get();
        get().dispatch({ type: 'resume', payload: { now } });
        const nextState = get();
        if (nextState.status === 'running' && prevState.status === 'paused') {
          emitTimerEvent({
            type: 'resume',
            mode: nextState.mode,
            completedFocusSessions: nextState.completedFocusSessions,
          });
        }
      },

      reset: () => {
        const prevState = get();
        get().dispatch({ type: 'reset' });
        emitTimerEvent({
          type: 'reset',
          mode: prevState.mode,
          completedFocusSessions: prevState.completedFocusSessions,
        });
      },

      tick: (now: number = Date.now()) => {
        const prevState = get();
        get().dispatch({ type: 'tick', payload: { now } });
        const nextState = get();
        if (prevState.status === 'running' && nextState.status === 'finished') {
          emitTimerEvent({
            type: 'finish',
            mode: prevState.mode,
            completedFocusSessions: nextState.completedFocusSessions,
          });
        }
      },

      finish: () => {
        const prevState = get();
        get().dispatch({ type: 'finish' });
        const nextState = get();
        if (prevState.status !== 'finished' && nextState.status === 'finished') {
          emitTimerEvent({
            type: 'finish',
            mode: prevState.mode,
            completedFocusSessions: nextState.completedFocusSessions,
          });
        }
      },

      advance: () => {
        get().dispatch({ type: 'advance' });
        const nextState = get();
        emitTimerEvent({
          type: 'modeChange',
          mode: nextState.mode,
          completedFocusSessions: nextState.completedFocusSessions,
        });
        if (nextState.autoStartNext) {
          get().start();
        }
      },

      switchMode: (mode: Mode) => {
        const prevState = get();
        if (prevState.mode === mode) return;
        get().dispatch({ type: 'switchMode', payload: { mode } });
        const nextState = get();
        if (nextState.mode === mode) {
          emitTimerEvent({
            type: 'modeChange',
            mode: nextState.mode,
            completedFocusSessions: nextState.completedFocusSessions,
          });
        }
      },

      applySettings: settings => {
        get().dispatch({ type: 'applySettings', payload: settings });
      },

      rollDay: (todayKey = getTodayDateString()) => {
        get().dispatch({ type: 'rollDay', payload: { todayKey } });
      },

      rehydrate: (now = Date.now(), todayKey = getTodayDateString()) => {
        const prevState = get();
        const wasRunning = prevState.status === 'running';
        const endedInPast = wasRunning && prevState.endsAt !== null && prevState.endsAt <= now;

        get().dispatch({ type: 'rehydrate', payload: { now, todayKey } });
        const nextState = get();

        if (endedInPast) {
          // Emit recovered event (not finish)
          emitTimerEvent({
            type: 'recovered',
            mode: prevState.mode,
            completedFocusSessions: nextState.completedFocusSessions,
          });
        }
      },
    }),
    {
      name: 'purrfocus:timer:v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        mode: state.mode,
        status: state.status,
        durations: state.durations,
        remaining: state.remaining,
        endsAt: state.endsAt,
        completedFocusSessions: state.completedFocusSessions,
        cyclesBeforeLongBreak: state.cyclesBeforeLongBreak,
        autoStartNext: state.autoStartNext,
        chimeOnFinish: state.chimeOnFinish,
        countDate: state.countDate,
        sessionId: state.sessionId,
      }),
      migrate: (persistedState: unknown) => {
        return sanitizeTimerState(persistedState);
      },
      onRehydrateStorage: () => state => {
        if (state) {
          const sanitized = sanitizeTimerState(state);
          Object.assign(state, sanitized);
          state.rehydrate();
        }
      },
    },
  ),
);

export function getTimerState(): TimerState {
  return useTimerStore.getState();
}
