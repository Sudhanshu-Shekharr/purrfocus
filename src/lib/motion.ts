import type { Transition } from 'framer-motion';

/**
 * Easing curve matching --ease-soft CSS token.
 * cubic-bezier(0.22, 1, 0.36, 1) — gentle overshoot, soft settle.
 */
export const easeSoft = [0.22, 1, 0.36, 1] as const;

/**
 * Duration constants (in seconds, as Framer Motion expects).
 * Match --dur-fast / --dur-base / --dur-slow CSS tokens.
 */
export const durFast = 0.15;
export const durBase = 0.25;
export const durSlow = 0.5;

/** Ready-made Framer Motion transition presets */
export const transitionFast: Transition = {
  ease: [...easeSoft],
  duration: durFast,
};

export const transitionBase: Transition = {
  ease: [...easeSoft],
  duration: durBase,
};

export const transitionSlow: Transition = {
  ease: [...easeSoft],
  duration: durSlow,
};
