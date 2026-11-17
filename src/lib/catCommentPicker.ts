import dialogueJson from '@/data/dialogue.json';

export const JOURNAL_NOTE_LINES: readonly string[] =
  dialogueJson.cat?.journalNote ?? [
    'every small effort counts. so proud of you.',
    'gentle steps forward. be soft with yourself.',
    'the hardest part is starting. you did it.',
    'tomorrow is a fresh sunrise. rest now.',
    'even a quiet session is a victory.',
    'soft purrs for showing up today.',
    'a peaceful chapter written in the quiet.',
    'steady and calm, like leaves drifting.',
    'you found a nice little rhythm today.',
    'breathe easy. the work is resting now.',
    'a lovely session. time for a warm cup.',
    'reading side by side is my favorite.',
    'look how far you have come, little by little.',
    'sparkles in the air and soft purrs.',
    'what a wonderful, peaceful focus time.',
    'happy tail wags. that felt wonderful.',
  ];

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Deterministically picks a cat line for a given sessionId and mood tone.
 * - Mood 1-2: Encouraging / rest-focused lines
 * - Mood 3 (or unset): Steady / gentle lines
 * - Mood 4-5: Warm / celebratory lines
 */
export function getCatCommentForSession(sessionId: string, mood?: 1 | 2 | 3 | 4 | 5): string {
  const hash = hashString(sessionId);

  if (mood === 1 || mood === 2) {
    const pool = JOURNAL_NOTE_LINES.slice(0, 6);
    return pool[hash % pool.length]!;
  }
  if (mood === 4 || mood === 5) {
    const pool = JOURNAL_NOTE_LINES.slice(11, 16);
    return pool[hash % pool.length]!;
  }
  // Mood 3 or unset
  const pool = JOURNAL_NOTE_LINES.slice(6, 11);
  return pool[hash % pool.length]!;
}
