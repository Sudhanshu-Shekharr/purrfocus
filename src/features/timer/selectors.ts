import type { Mode, Status, TimerDurations, TimerState } from './types';
import { getNextMode } from './reducer';

export const selectMode = (state: TimerState): Mode => state.mode;
export const selectStatus = (state: TimerState): Status => state.status;
export const selectRemaining = (state: TimerState): number => state.remaining;
export const selectDurations = (state: TimerState): TimerDurations => state.durations;
export const selectCompletedFocusSessions = (state: TimerState): number =>
  state.completedFocusSessions;
export const selectCyclesBeforeLongBreak = (state: TimerState): number =>
  state.cyclesBeforeLongBreak;
export const selectAutoStartNext = (state: TimerState): boolean => state.autoStartNext;
export const selectChimeOnFinish = (state: TimerState): boolean => state.chimeOnFinish;
export const selectSessionId = (state: TimerState): string | null => state.sessionId;
export const selectEndsAt = (state: TimerState): number | null => state.endsAt;
export const selectCountDate = (state: TimerState): string => state.countDate;

export const selectNextMode = (state: TimerState): Mode =>
  getNextMode(state.mode, state.completedFocusSessions, state.cyclesBeforeLongBreak);

export const selectIsActive = (state: TimerState): boolean =>
  state.status === 'running' || state.status === 'paused';
