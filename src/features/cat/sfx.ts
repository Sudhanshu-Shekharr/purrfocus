import { purr, pop, rustle } from '@/features/audio/sfx';

/**
 * Play a synthesized gentle cat purr.
 * Master gain capped at <= 0.15, respects global prefs SFX toggle.
 */
export function playPurrSfx(): void {
  purr();
}

/**
 * Play a tiny, pleasant pop sound (treat drop or bubble tap).
 * Master gain <= 0.12, respects global prefs SFX toggle.
 */
export function playPopSfx(): void {
  pop();
}

/**
 * Play a soft rustle / swoosh sound (for yarn ball or toy pounce).
 * Master gain <= 0.10, respects global prefs SFX toggle.
 */
export function playRustleSfx(): void {
  rustle();
}
