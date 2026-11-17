export type ClockFormat = 'auto' | '12h' | '24h';
export type ReduceMotionOverride = 'system' | 'on' | 'off';

export type Prefs = {
  /** Global UI sound effects toggle (persisted) */
  sfxOn: boolean;
  /** Focus Mode active state (session-only; NOT persisted) */
  focusMode: boolean;
  /** Rare cosmetic visitors / scenic events toggle (persisted) */
  rareEventsOn: boolean;
  /** Local calendar date of the last shown 'welcome back' greeting (persisted) */
  lastWelcomeDay?: string | null;
  /** Clock display format: auto | 12h | 24h (persisted) */
  clockFormat: ClockFormat;
  /** Reduce motion override: system | on | off (persisted) */
  reduceMotion: ReduceMotionOverride;
};

export type PrefsActions = {
  setSfxOn: (sfxOn: boolean) => void;
  toggleSfx: () => void;
  setFocusMode: (focusMode: boolean) => void;
  toggleFocusMode: () => void;
  setRareEventsOn: (rareEventsOn: boolean) => void;
  toggleRareEvents: () => void;
  setLastWelcomeDay: (day: string | null) => void;
  setClockFormat: (clockFormat: ClockFormat) => void;
  setReduceMotion: (reduceMotion: ReduceMotionOverride) => void;
  resetPrefs: () => void;
};

export type PrefsStore = Prefs & PrefsActions;
