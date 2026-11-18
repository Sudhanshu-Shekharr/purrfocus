/**
 * Six original, concise opening lines for the hero headline.
 * Every variant is sized to fit cleanly on a single line from 320 px to 2560 px.
 */
export const HERO_FIRST_LINE_VARIANTS = [
  'Study with a cat.',
  'Read with a cat.',
  'Write with a cat.',
  'Think with a cat.',
  'Work with a cat.',
  'Learn with a cat.',
] as const;

export const HERO_STATIC_HEADING = 'Study with a cat. Find your focus.';

/** Duration each hero headline variant remains visible before transitioning (ms). */
export const HERO_ROTATION_INTERVAL_MS = 5500;

/** Duration of the fade-and-flip transition in seconds (500 ms total). */
export const HERO_TRANSITION_DURATION_S = 0.5;

/** Subtle rotateX tilt angle in degrees for the fade-and-flip transition. */
export const HERO_FLIP_DEGREES = 15;
