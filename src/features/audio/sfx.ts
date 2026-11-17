import { getOrCreateAudioContext, playChime } from './chime';
import { usePrefsStore } from '@/features/prefs/store';

/**
 * Helper to ensure audio is enabled and an active AudioContext exists.
 * Returns null if muted or unprimed.
 */
function getActiveAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!usePrefsStore.getState().sfxOn) return null;

  const ctx = getOrCreateAudioContext();
  if (!ctx) return null;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  return ctx;
}

/**
 * Wrap the existing timer chime with global SFX check.
 * Master gain ~0.12.
 */
export function chime(): void {
  try {
    const ctx = getActiveAudioContext();
    if (!ctx) return;
    playChime();
  } catch {
    // Silently catch audio errors
  }
}

/**
 * Soft tactile click for button presses and micro-interactions.
 * Master gain <= 0.06.
 */
export function click(): void {
  try {
    const ctx = getActiveAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.02;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1050, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + duration);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // Silently catch audio errors
  }
}

/**
 * Gentle feline purr (68Hz tone with 26Hz tremolo amplitude modulation).
 * Master gain <= 0.14.
 */
export function purr(): void {
  try {
    const ctx = getActiveAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 1.4;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.14, now + 0.1);
    masterGain.gain.setValueAtTime(0.14, now + duration - 0.2);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    masterGain.connect(ctx.destination);

    // Low rumble oscillator (sine wave at 68Hz)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(68, now);

    // Tremolo LFO (sine wave at 26Hz to simulate purr throat vibrations)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(26, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.06, now);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.08, now);

    lfo.connect(lfoGain);
    lfoGain.connect(oscGain.gain);

    osc.connect(oscGain);
    oscGain.connect(masterGain);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + duration);
    lfo.stop(now + duration);
  } catch {
    // Silently catch audio playback errors
  }
}

/**
 * Pleasant treat drop / bubble pop sound.
 * Master gain <= 0.12.
 */
export function pop(): void {
  try {
    const ctx = getActiveAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.08;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + duration);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // Silently catch audio playback errors
  }
}

/**
 * Soft rustle / yarn batting flutter.
 * Master gain <= 0.08.
 */
export function rustle(): void {
  try {
    const ctx = getActiveAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.22;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.08, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    masterGain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.linearRampToValueAtTime(180, now + duration);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(460, now);
    osc2.frequency.linearRampToValueAtTime(220, now + duration);

    osc1.connect(masterGain);
    osc2.connect(masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  } catch {
    // Silently catch audio playback errors
  }
}

/**
 * Distant gentle bird chirp for scenic rare events.
 * Two light ascending syllables. Master gain <= 0.08.
 */
export function birdChirp(): void {
  try {
    const ctx = getActiveAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.07, now);
    masterGain.connect(ctx.destination);

    // Chirp note 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2400, now);
    osc1.frequency.exponentialRampToValueAtTime(3200, now + 0.07);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.8, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.09);

    // Chirp note 2 (slightly higher, after short pause)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2700, now + 0.11);
    osc2.frequency.exponentialRampToValueAtTime(3600, now + 0.18);
    gain2.gain.setValueAtTime(0.001, now + 0.11);
    gain2.gain.linearRampToValueAtTime(0.7, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.11);
    osc2.stop(now + 0.21);
  } catch {
    // Silently catch audio playback errors
  }
}

/**
 * SFX API object for ergonomic access: sfx.click(), sfx.purr(), etc.
 */
export const sfx = {
  click,
  chime,
  purr,
  pop,
  rustle,
  birdChirp,
};
