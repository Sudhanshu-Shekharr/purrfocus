import type { Mode, TimerDurations, TimerState } from './types';

export const DEFAULT_DURATIONS: TimerDurations = {
  focus: 25 * 60,      // 1500 seconds (25 minutes)
  shortBreak: 5 * 60,  // 300 seconds (5 minutes)
  longBreak: 15 * 60,  // 900 seconds (15 minutes)
};

export const MIN_DURATION_MINUTES = 1;
export const MAX_DURATION_MINUTES = 180;
export const MIN_DURATION_SECONDS = MIN_DURATION_MINUTES * 60;
export const MAX_DURATION_SECONDS = MAX_DURATION_MINUTES * 60;

export const DEFAULT_CYCLES_BEFORE_LONG_BREAK = 4;
export const MIN_CYCLES = 1;
export const MAX_CYCLES = 12;

export const MODE_LABELS: Record<Mode, string> = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
};

export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidDurationMinutes(val: unknown): val is number {
  return (
    typeof val === 'number' &&
    Number.isInteger(val) &&
    val >= MIN_DURATION_MINUTES &&
    val <= MAX_DURATION_MINUTES
  );
}

export function isValidDurationSeconds(val: unknown): val is number {
  return (
    typeof val === 'number' &&
    Number.isInteger(val) &&
    val >= MIN_DURATION_SECONDS &&
    val <= MAX_DURATION_SECONDS
  );
}

export function isValidCycles(val: unknown): val is number {
  return (
    typeof val === 'number' &&
    Number.isInteger(val) &&
    val >= MIN_CYCLES &&
    val <= MAX_CYCLES
  );
}

export function getInitialTimerState(todayKey: string = getTodayDateString()): TimerState {
  return {
    mode: 'focus',
    status: 'idle',
    durations: { ...DEFAULT_DURATIONS },
    remaining: DEFAULT_DURATIONS.focus,
    endsAt: null,
    completedFocusSessions: 0,
    cyclesBeforeLongBreak: DEFAULT_CYCLES_BEFORE_LONG_BREAK,
    autoStartNext: false,
    chimeOnFinish: true,
    countDate: todayKey,
    sessionId: null,
  };
}
