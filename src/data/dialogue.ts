import dialogueJson from './dialogue.json';
import type { Mode, Status } from '@/features/timer/types';

export type SessionCaptionsMap = Record<string, string[]>;

export type MicroCopyStatusMap = {
  idle: string[];
  running: string[];
  paused: string[];
  finished: string[];
};

export type MicroCopyModeMap = Record<Mode, MicroCopyStatusMap>;

export type CatDialogueContext =
  | 'focus'
  | 'break'
  | 'idle'
  | 'pet'
  | 'play'
  | 'playBlockedFocus'
  | 'treat'
  | 'stretch'
  | 'complete'
  | 'reset'
  | 'wake'
  | 'sleepy'
  | 'morning'
  | 'evening'
  | 'lateNight'
  | 'click'
  | 'welcomeBack'
  | 'taskDone'
  | 'deskTap'
  | 'journalNote';

export type CatDialogueMap = Record<CatDialogueContext, string[]>;

export type DialogueData = {
  sessionCaptions: SessionCaptionsMap;
  microCopy: MicroCopyModeMap;
  cat?: CatDialogueMap;
  intentions?: {
    emptyHints: string[];
  };
};

export const CAT_DIALOGUE_CONTEXTS: readonly CatDialogueContext[] = [
  'focus',
  'break',
  'idle',
  'pet',
  'play',
  'playBlockedFocus',
  'treat',
  'stretch',
  'complete',
  'reset',
  'wake',
  'sleepy',
  'morning',
  'evening',
  'lateNight',
  'click',
  'welcomeBack',
  'taskDone',
  'deskTap',
  'journalNote',
] as const;

export function validateDialogueData(data: unknown): data is DialogueData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Partial<DialogueData>;

  if (!d.sessionCaptions || typeof d.sessionCaptions !== 'object') return false;
  for (let i = 0; i <= 12; i++) {
    const pool = d.sessionCaptions[String(i)];
    if (!Array.isArray(pool) || pool.length < 2) return false;
  }

  if (!d.microCopy || typeof d.microCopy !== 'object') return false;
  const modes: Mode[] = ['focus', 'shortBreak', 'longBreak'];
  const statuses: Status[] = ['idle', 'running', 'paused', 'finished'];

  for (const m of modes) {
    const modePool = d.microCopy[m];
    if (!modePool || typeof modePool !== 'object') return false;
    for (const s of statuses) {
      const statusPool = modePool[s];
      if (!Array.isArray(statusPool) || statusPool.length < 4) return false;
    }
  }

  if (d.cat && typeof d.cat === 'object') {
    for (const ctx of CAT_DIALOGUE_CONTEXTS) {
      const pool = d.cat[ctx];
      if (!Array.isArray(pool) || pool.length < 15) return false;
      for (const line of pool) {
        if (typeof line !== 'string' || line.length >= 60) return false;
      }
    }
  }

  if (d.intentions && typeof d.intentions === 'object') {
    if (d.intentions.emptyHints) {
      if (!Array.isArray(d.intentions.emptyHints) || d.intentions.emptyHints.length < 6) return false;
      for (const hint of d.intentions.emptyHints) {
        if (typeof hint !== 'string' || hint.length >= 60) return false;
      }
    }
  }

  return true;
}

export const DIALOGUE_DATA: DialogueData = validateDialogueData(dialogueJson)
  ? (dialogueJson as DialogueData)
  : {
      sessionCaptions: {
        '0': ['Your first little step', 'The cushion is waiting'],
      },
      microCopy: {
        focus: {
          idle: ['A small start is still a start.'],
          running: ["You're doing it, step by step."],
          paused: ['Paused. The world can wait a moment.'],
          finished: ['Focus complete. Soft sigh of relief.'],
        },
        shortBreak: {
          idle: ['A little tea break awaits.'],
          running: ['Breathe. Sip some cool water.'],
          paused: ['Taking a break from your break.'],
          finished: ['Break complete. Refreshed and ready.'],
        },
        longBreak: {
          idle: ['A cozy, deep rest is calling.'],
          running: ['Find a sunbeam and curl right up.'],
          paused: ['Resting still, without hurry.'],
          finished: ['Long rest done. Feeling lighter.'],
        },
      },
    };

/**
 * Deterministic hash for string or numeric seed to select line stably.
 */
export function hashSeed(seed: string | number): number {
  if (typeof seed === 'number') {
    return Math.abs(Math.floor(seed));
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Pick a line stably from pool according to seed.
 * Guarantees referential stability across re-renders when seed does not change.
 */
export function pickLine(pool: readonly string[] | string[], seed: string | number = 0): string {
  if (!pool || pool.length === 0) return '';
  const idx = hashSeed(seed) % pool.length;
  return pool[idx] ?? pool[0] ?? '';
}

export function getSessionCaption(
  completedCount: number,
  seed: string | number = completedCount,
): string {
  const clamped = Math.max(0, Math.min(12, completedCount));
  const pool = DIALOGUE_DATA.sessionCaptions[String(clamped)] ?? [
    'Your first little step',
  ];
  return pickLine(pool, seed);
}

export function getMicroCopy(
  mode: Mode,
  status: Status,
  seed: string | number = `${mode}:${status}`,
): string {
  const modeMap = DIALOGUE_DATA.microCopy[mode];
  if (!modeMap) return 'A small start is still a start.';
  const pool = modeMap[status] ?? modeMap.idle;
  return pickLine(pool, seed);
}

export function getCatDialoguePool(context: CatDialogueContext): string[] {
  if (DIALOGUE_DATA.cat && DIALOGUE_DATA.cat[context]) {
    return DIALOGUE_DATA.cat[context];
  }
  return ['ready whenever you are.'];
}

export function getEmptyIntentionHints(): string[] {
  return (
    DIALOGUE_DATA.intentions?.emptyHints ?? [
      'One chapter? A few flashcards? Start small.',
      'Read three pages without rushing.',
      "Review yesterday's notes gently.",
      'Draft the first paragraph.',
      'Solve two practice problems.',
      'Organize your workspace for tomorrow.',
    ]
  );
}

