import type { PoseId } from './types';
import { getCatDialoguePool, type CatDialogueContext } from '@/data/dialogue';

export type { CatDialogueContext };

export const DEFAULT_CAT_LINES: Record<CatDialogueContext, string[]> = {
  focus: [
    'right beside you. one page at a time.',
    'deep focus mode engaged. soft paws.',
    'curled up while you do your best.',
    'reading quietly next to you.',
    'steady rhythm, calm thoughts.',
    'watching the clock tick softly.',
    'you are doing wonderfully.',
    'keeping you cozy while you study.',
  ],
  break: [
    'tea time! stretch your paws.',
    'a nice deep breath together.',
    'looking out at the gentle clouds.',
    'time to sip some warm water.',
    'you earned this peaceful moment.',
    'soft sighs and relaxed shoulders.',
  ],
  idle: [
    'ready whenever you are.',
    'the warm cushion is waiting.',
    'no rush at all, just being here.',
    'watching the dust motes drift by.',
    'tail swishing softly in the sun.',
    'a quiet little corner of the day.',
  ],
  pet: [
    'purrrrr... that is the spot.',
    'soft chin scritches are the best.',
    'blissful purring activates.',
    'eyes softly squinting with joy.',
    'happy gentle rumble.',
    'thank you for the gentle pats.',
  ],
  play: [
    'pounce! got the yarn ball!',
    'batting the little toy around.',
    'wiggle wiggle... pounce!',
    'so fast, so nimble!',
    'catches the yarn with two paws.',
  ],
  playBlockedFocus: [
    'almost there! let us finish first 🐾',
    'chapter first, yarn ball right after.',
    'stay in the flow. i will hold the toy.',
    'steady paws now, playtime at break!',
  ],
  treat: [
    'crunch crunch... delightful snack!',
    'tiny fish cookie! my favorite.',
    'nibble nibble, thank you friend.',
    'such a delicious little treat.',
  ],
  stretch: [
    'biiiiiig stretch from nose to tail!',
    'yawn... reach for the sky now.',
    'rolling on my back, so limber.',
    'shake out those shoulders!',
  ],
  complete: [
    'we did it! wonderful focus session.',
    'sparkles and purrs all around!',
    'look at you go, so very proud.',
    'another chapter gently conquered.',
  ],
  reset: [
    'it is okay. we start fresh anytime.',
    'no worries at all, deep breath.',
    'gentle reset. the cushion is ready.',
    'fresh start whenever you want.',
  ],
  sleepy: [
    'zzzz... sleepy paws dreaming...',
    'just resting my eyelids a little...',
    'soft snores in a warm sunbeam...',
    'curled like a cozy croissant...',
  ],
  wake: [
    'oh! hi. i am right here.',
    'yawn... blinked and you were here.',
    'ready and awake! what are we doing?',
    'soft stretch, wide eyes again.',
  ],
  morning: [
    'good morning. gentle start to the day.',
    'sun is warm, tea is brewing.',
    'ready for a quiet morning study.',
  ],
  evening: [
    'good evening. the sky is turning peach.',
    'golden hour lighting up our quiet desk.',
    'evening calm settling into the room.',
  ],
  lateNight: [
    'late night study session, nice and quiet.',
    'the stars are out, keep breathing slow.',
    'peaceful midnight hours together.',
  ],
  click: [
    'boop! my nose feels a little cold.',
    'meow? yes, i am right here.',
    'gentle tap on my ear tip.',
  ],
  welcomeBack: [
    'Welcome back 🌷 I saved your spot.',
    'so good to see you again 🌷',
    'the cushion stayed warm for you.',
  ],
  taskDone: [
    'scratch that one off! so proud of you.',
    'one small victory completed ✨',
    'little checkmark, big steady progress.',
  ],
  deskTap: [
    'curious paw tapping the desk treasure.',
    'sniffs the little object softly.',
    'i like this right here next to us.',
  ],
  journalNote: [
    'every small effort counts. so proud of you.',
    'gentle steps forward. be soft with yourself.',
    'the hardest part is starting. you did it.',
  ],
};

/**
 * Get lines for a given context. Defaults to fallback lines.
 */
export function getCatLines(context: CatDialogueContext): string[] {
  const pool = getCatDialoguePool(context);
  if (pool && pool.length > 0) {
    return pool;
  }
  return DEFAULT_CAT_LINES[context] ?? DEFAULT_CAT_LINES.idle;
}

/**
 * State caption descriptor under the cat's name.
 */
export const POSE_DESCRIPTORS: Record<PoseId, string> = {
  idle_happy: 'a happy little cat',
  study_book: 'reading beside you',
  study_write: 'taking quiet notes',
  study_laptop: 'typing on a tiny laptop',
  break_tea: 'enjoying warm tea',
  break_nap: 'napping between chapters',
  stretch: 'stretching together',
  pet_happy: 'purring with bliss',
  play: 'pouncing at yarn',
  treat: 'nibbling a tiny treat',
  celebrate: 'purring with pride',
  sleepy: 'dozing in a warm spot',
  sad_gentle: 'waiting patiently',
};
