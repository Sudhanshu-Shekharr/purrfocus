let audioCtx: AudioContext | null = null;

export function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioCtxConstructor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioCtxConstructor) {
      try {
        audioCtx = new AudioCtxConstructor();
      } catch {
        audioCtx = null;
      }
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Ignored if user hasn't interacted yet
    });
  }

  return audioCtx;
}

/**
 * Prime the AudioContext on first user interaction (Start click).
 */
export function primeAudioContext(): void {
  try {
    getOrCreateAudioContext();
  } catch {
    // Silently catch errors
  }
}

/**
 * Play cozy two-tone chime synthesised with Web Audio API.
 * Two soft sine notes with gentle envelope, ~1.2s total, low gain.
 */
export function playChime(): void {
  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Master gain for low volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.12, now);
    masterGain.connect(ctx.destination);

    // Note 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);

    // Envelope 1: soft attack 0.04s, gentle decay 0.6s
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.8, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc1.connect(gain1);
    gain1.connect(masterGain);

    osc1.start(now);
    osc1.stop(now + 0.7);

    // Note 2: B5 (987.77 Hz) slightly delayed (+0.18s)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.18);

    // Envelope 2: soft attack 0.04s, gentle decay 0.9s
    gain2.gain.setValueAtTime(0.001, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.7, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc2.start(now + 0.18);
    osc2.stop(now + 1.25);
  } catch {
    // Silently catch all audio playback errors
  }
}
