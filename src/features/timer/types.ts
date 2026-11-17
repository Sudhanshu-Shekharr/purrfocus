export type Mode = 'focus' | 'shortBreak' | 'longBreak';
export type Status = 'idle' | 'running' | 'paused' | 'finished';

export type TimerDurations = Record<Mode, number>;

export type TimerState = {
  mode: Mode;
  status: Status;
  durations: TimerDurations;      // SECONDS. defaults 1500 / 300 / 900
  remaining: number;              // whole seconds. authoritative when not running
  endsAt: number | null;          // epoch ms, only while running
  completedFocusSessions: number; // 0..cyclesBeforeLongBreak (dots + cadence)
  cyclesBeforeLongBreak: number;  // default 4
  autoStartNext: boolean;         // default false
  chimeOnFinish: boolean;         // default true
  countDate: string;              // local 'YYYY-MM-DD' that completedFocusSessions belongs to
  sessionId: string | null;       // id of the current run, for idempotent logging
};

export type TimerSettingsDraft = {
  durations: Record<Mode, number>; // in minutes (1..180)
  cyclesBeforeLongBreak: number;   // 1..12
  autoStartNext: boolean;
  chimeOnFinish: boolean;
};

export type TimerAction =
  | { type: 'start'; payload: { now: number; sessionId: string } }
  | { type: 'pause'; payload: { now: number } }
  | { type: 'resume'; payload: { now: number } }
  | { type: 'reset' }
  | { type: 'tick'; payload: { now: number } }
  | { type: 'finish'; payload?: { now?: number } }
  | { type: 'advance' }
  | { type: 'switchMode'; payload: { mode: Mode } }
  | {
      type: 'applySettings';
      payload: {
        durations?: Partial<TimerDurations>;
        cyclesBeforeLongBreak?: number;
        autoStartNext?: boolean;
        chimeOnFinish?: boolean;
      };
    }
  | { type: 'rollDay'; payload: { todayKey: string } }
  | { type: 'rehydrate'; payload: { now: number; todayKey: string } };
