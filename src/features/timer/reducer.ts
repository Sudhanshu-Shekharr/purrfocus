import type { Mode, TimerAction, TimerDurations, TimerState } from './types';
import {
  isValidDurationSeconds,
  isValidCycles,
} from './constants';

export function getNextMode(
  currentMode: Mode,
  completedFocusSessions: number,
  cyclesBeforeLongBreak: number,
): Mode {
  if (currentMode === 'focus') {
    return completedFocusSessions >= cyclesBeforeLongBreak ? 'longBreak' : 'shortBreak';
  }
  return 'focus';
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'start': {
      if (state.status === 'running') {
        return state;
      }
      const { now, sessionId } = action.payload;
      const remaining = state.remaining > 0 ? state.remaining : state.durations[state.mode];
      return {
        ...state,
        status: 'running',
        remaining,
        endsAt: now + remaining * 1000,
        sessionId,
      };
    }

    case 'pause': {
      if (state.status !== 'running' || state.endsAt === null) {
        return state;
      }
      const { now } = action.payload;
      const remaining = Math.max(0, Math.ceil((state.endsAt - now) / 1000));
      return {
        ...state,
        status: 'paused',
        remaining,
        endsAt: null,
      };
    }

    case 'resume': {
      if (state.status !== 'paused') {
        return state;
      }
      const { now } = action.payload;
      const remaining = state.remaining > 0 ? state.remaining : state.durations[state.mode];
      return {
        ...state,
        status: 'running',
        remaining,
        endsAt: now + remaining * 1000,
      };
    }

    case 'reset': {
      return {
        ...state,
        status: 'idle',
        remaining: state.durations[state.mode],
        endsAt: null,
        sessionId: null,
      };
    }

    case 'tick': {
      if (state.status !== 'running' || state.endsAt === null) {
        return state;
      }
      const { now } = action.payload;
      const remaining = Math.max(0, Math.ceil((state.endsAt - now) / 1000));

      if (remaining <= 0) {
        return timerReducer(state, { type: 'finish' });
      }

      // Referential equality: if whole second is unchanged, return identical state object
      if (remaining === state.remaining) {
        return state;
      }

      return {
        ...state,
        remaining,
      };
    }

    case 'finish': {
      if (state.status === 'finished') {
        return state;
      }

      let completed = state.completedFocusSessions;
      if (state.mode === 'focus') {
        completed =
          completed >= state.cyclesBeforeLongBreak ? 1 : completed + 1;
      } else if (state.mode === 'longBreak') {
        completed = 0;
      }

      return {
        ...state,
        status: 'finished',
        remaining: 0,
        endsAt: null,
        completedFocusSessions: completed,
      };
    }

    case 'advance': {
      if (state.status !== 'finished') {
        return state;
      }

      const next = getNextMode(
        state.mode,
        state.completedFocusSessions,
        state.cyclesBeforeLongBreak,
      );

      return {
        ...state,
        mode: next,
        status: 'idle',
        remaining: state.durations[next],
        endsAt: null,
        sessionId: null,
      };
    }

    case 'switchMode': {
      // Switching is only legal from idle, paused or finished
      if (state.status === 'running') {
        return state;
      }

      const nextMode = action.payload.mode;
      return {
        ...state,
        mode: nextMode,
        status: 'idle',
        remaining: state.durations[nextMode],
        endsAt: null,
        sessionId: null,
      };
    }

    case 'applySettings': {
      const {
        durations: partialDurations,
        cyclesBeforeLongBreak,
        autoStartNext,
        chimeOnFinish,
      } = action.payload;

      const nextDurations: TimerDurations = { ...state.durations };

      if (partialDurations) {
        (['focus', 'shortBreak', 'longBreak'] as Mode[]).forEach(m => {
          const val = partialDurations[m];
          if (val !== undefined && isValidDurationSeconds(val)) {
            nextDurations[m] = val;
          }
        });
      }

      let nextCycles = state.cyclesBeforeLongBreak;
      if (cyclesBeforeLongBreak !== undefined && isValidCycles(cyclesBeforeLongBreak)) {
        nextCycles = cyclesBeforeLongBreak;
      }

      // Safely clamp completedFocusSessions when cycles are lowered
      const clampedCompleted = Math.min(state.completedFocusSessions, nextCycles);

      let nextRemaining = state.remaining;
      // Changing the duration of the current mode while idle or finished updates remaining.
      // While running or paused, it does not touch the live session.
      if (state.status === 'idle' || state.status === 'finished') {
        nextRemaining = nextDurations[state.mode];
      }

      return {
        ...state,
        durations: nextDurations,
        cyclesBeforeLongBreak: nextCycles,
        completedFocusSessions: clampedCompleted,
        autoStartNext: typeof autoStartNext === 'boolean' ? autoStartNext : state.autoStartNext,
        chimeOnFinish: typeof chimeOnFinish === 'boolean' ? chimeOnFinish : state.chimeOnFinish,
        remaining: nextRemaining,
      };
    }

    case 'rollDay': {
      const { todayKey } = action.payload;
      if (state.countDate === todayKey) {
        return state;
      }
      return {
        ...state,
        countDate: todayKey,
        completedFocusSessions: 0,
      };
    }

    case 'rehydrate': {
      const { now, todayKey } = action.payload;
      let next = state;

      // Check day rollover first
      if (next.countDate !== todayKey) {
        next = {
          ...next,
          countDate: todayKey,
          completedFocusSessions: 0,
        };
      }

      // Recovery rules
      if (next.status === 'running') {
        if (next.endsAt !== null && next.endsAt > now) {
          const remaining = Math.max(0, Math.ceil((next.endsAt - now) / 1000));
          next = {
            ...next,
            remaining,
          };
        } else {
          // Finished while away
          next = timerReducer(next, { type: 'finish' });
        }
      }

      return next;
    }

    default:
      return state;
  }
}
