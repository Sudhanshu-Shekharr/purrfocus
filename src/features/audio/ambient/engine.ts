import { getOrCreateAudioContext } from '../chime';
import { useAmbientStore } from './store';
import type { AmbientLayerId, LayerSource } from './types';
import { SoftPianoSource } from './sources/softPiano';
import { RainSource } from './sources/rain';
import { BrownNoiseSource } from './sources/brownNoise';

export const FADE_DURATION_SEC = 0.8;
export const FADE_DURATION_MS = 800;

/**
 * Pure calculation of effective gain: level * master * (muted ? 0 : 1).
 */
export function calculateEffectiveGain(
  level: number,
  master: number,
  muted: boolean,
): number {
  if (muted) return 0;
  const clampedLevel = Math.max(0, Math.min(1, level));
  const clampedMaster = Math.max(0, Math.min(1, master));
  return Math.round(clampedLevel * clampedMaster * 1000) / 1000;
}

/**
 * Pure calculation of master gain node target: master * (muted ? 0 : 1).
 */
export function calculateMasterGain(master: number, muted: boolean): number {
  if (muted) return 0;
  return Math.max(0, Math.min(1, master));
}

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private sources: Map<string, LayerSource> = new Map();
  private layerGainNodes: Map<string, GainNode> = new Map();
  private cleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private storeUnsubscribe: (() => void) | null = null;
  private isStarted = false;

  constructor(customCtx?: AudioContext) {
    if (customCtx) {
      this.ctx = customCtx;
    }
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public registerSource(source: LayerSource): void {
    this.sources.set(source.id, source);
    // If engine is already active and layer level > 0, sync it immediately
    if (this.isStarted) {
      this.syncLayer(source.id);
    }
  }

  public unregisterSource(id: AmbientLayerId): void {
    this.teardownLayer(id);
    const source = this.sources.get(id);
    if (source) {
      source.dispose();
    }
    this.sources.delete(id);
  }

  public getSource(id: AmbientLayerId): LayerSource | undefined {
    return this.sources.get(id);
  }

  public getActiveLayerGainNodesCount(): number {
    return this.layerGainNodes.size;
  }

  public registerDefaultSources(): void {
    if (!this.getSource('soft-piano')) {
      this.registerSource(new SoftPianoSource());
    }
    if (!this.getSource('rainfall')) {
      this.registerSource(new RainSource());
    }
    if (!this.getSource('brown-noise')) {
      this.registerSource(new BrownNoiseSource());
    }
  }

  /**
   * Initialize audio context and master gain node upon user gesture.
   * If sessionStarted is false, will NOT create context or start playback.
   */
  public init(contextGetter: () => AudioContext | null = getOrCreateAudioContext): boolean {
    this.registerDefaultSources();

    if (this.storeUnsubscribe) {
      return true;
    }

    // Subscribe to store state changes
    this.storeUnsubscribe = useAmbientStore.subscribe((state, prevState) => {
      // Autoplay gate: do not activate audio until sessionStarted is true
      if (!state.sessionStarted) {
        return;
      }

      if (!this.isStarted) {
        this.startEngine(contextGetter);
      }

      // Sync master / mute changes
      if (state.master !== prevState.master || state.muted !== prevState.muted) {
        this.syncMaster(state.master, state.muted);
      }

      // Sync any changed layer levels
      for (const [id, level] of Object.entries(state.levels)) {
        if (level !== prevState.levels[id]) {
          this.syncLayer(id);
        }
      }

      // Check for removed layers
      for (const id of Object.keys(prevState.levels)) {
        if (!(id in state.levels)) {
          this.teardownLayer(id);
        }
      }
    });

    // Check if initial store state has sessionStarted
    const initialState = useAmbientStore.getState();
    if (initialState.sessionStarted) {
      this.startEngine(contextGetter);
    }

    return true;
  }

  /**
   * Explicit user-gesture start method (primes context and activates engine).
   */
  public startEngine(contextGetter: () => AudioContext | null = getOrCreateAudioContext): boolean {
    this.registerDefaultSources();

    if (this.isStarted && this.ctx && this.masterGainNode) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    const ctx = this.ctx ?? contextGetter();
    if (!ctx) {
      return false;
    }
    this.ctx = ctx;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (!this.masterGainNode) {
      const state = useAmbientStore.getState();
      const targetMaster = calculateMasterGain(state.master, state.muted);
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(targetMaster, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.masterGainNode = masterGain;
    }

    this.isStarted = true;

    // Sync all currently registered sources
    const state = useAmbientStore.getState();
    this.syncMaster(state.master, state.muted);
    for (const id of this.sources.keys()) {
      this.syncLayer(id);
    }

    return true;
  }

  /**
   * Ramps master gain over 800ms.
   */
  public syncMaster(master: number, muted: boolean): void {
    if (!this.ctx || !this.masterGainNode) return;

    const target = calculateMasterGain(master, muted);
    const now = this.ctx.currentTime;
    const gainParam = this.masterGainNode.gain;

    gainParam.cancelScheduledValues(now);
    gainParam.setValueAtTime(gainParam.value, now);
    gainParam.linearRampToValueAtTime(target, now + FADE_DURATION_SEC);

    // Also sync any file-based sources that may manage their own master scaling
    for (const [id, source] of this.sources.entries()) {
      if (source.kind === 'file') {
        const state = useAmbientStore.getState();
        const level = state.levels[id] ?? 0;
        const effective = calculateEffectiveGain(level, master, muted);
        source.setGain(effective, FADE_DURATION_SEC);
      }
    }
  }

  /**
   * Synchronizes a layer with its target level from the store.
   */
  public syncLayer(id: AmbientLayerId): void {
    const source = this.sources.get(id);
    if (!source) return;

    const state = useAmbientStore.getState();
    const targetLevel = state.sessionStarted ? (state.levels[id] ?? 0) : 0;

    // Cancel any pending cleanup timer for this layer
    const existingTimer = this.cleanupTimers.get(id);
    if (existingTimer !== null && existingTimer !== undefined) {
      clearTimeout(existingTimer);
      this.cleanupTimers.delete(id);
    }

    // For file-based sources (Howler)
    if (source.kind === 'file') {
      const effective = calculateEffectiveGain(targetLevel, state.master, state.muted);
      if (effective > 0) {
        if (!source.isConnected()) {
          source.start(this.ctx!, this.masterGainNode!);
        }
        source.setGain(effective, FADE_DURATION_SEC);
      } else {
        source.setGain(0, FADE_DURATION_SEC);
        const timer = setTimeout(() => {
          source.stop();
          this.cleanupTimers.delete(id);
        }, FADE_DURATION_MS);
        this.cleanupTimers.set(id, timer);
      }
      return;
    }

    // For Web Audio synth sources
    if (!this.ctx || !this.masterGainNode) {
      return;
    }

    const now = this.ctx.currentTime;
    let gainNode = this.layerGainNodes.get(id);

    if (targetLevel > 0) {
      if (!gainNode) {
        gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.connect(this.masterGainNode);
        this.layerGainNodes.set(id, gainNode);
        source.start(this.ctx, gainNode);
      }

      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(targetLevel, now + FADE_DURATION_SEC);
    } else {
      if (gainNode) {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0.0001, now + FADE_DURATION_SEC);

        // Disconnect and stop source after the 800ms fade completes
        const timer = setTimeout(() => {
          this.cleanupLayerNodes(id);
          this.cleanupTimers.delete(id);
        }, FADE_DURATION_MS);
        this.cleanupTimers.set(id, timer);
      }
    }
  }

  private cleanupLayerNodes(id: AmbientLayerId): void {
    const gainNode = this.layerGainNodes.get(id);
    const source = this.sources.get(id);

    if (source) {
      source.stop();
    }

    if (gainNode) {
      try {
        gainNode.disconnect();
      } catch {
        // Silently ignore if already disconnected
      }
      this.layerGainNodes.delete(id);
    }
  }

  private teardownLayer(id: AmbientLayerId): void {
    const timer = this.cleanupTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(id);
    }
    this.cleanupLayerNodes(id);
  }

  public dispose(): void {
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }

    for (const timer of this.cleanupTimers.values()) {
      clearTimeout(timer);
    }
    this.cleanupTimers.clear();

    for (const id of Array.from(this.sources.keys())) {
      this.teardownLayer(id);
      const source = this.sources.get(id);
      if (source) {
        source.dispose();
      }
    }
    this.sources.clear();

    if (this.masterGainNode) {
      try {
        this.masterGainNode.disconnect();
      } catch {
        // Silently ignore
      }
      this.masterGainNode = null;
    }

    this.isStarted = false;
  }
}

// Global shared ambient engine singleton
export const ambientEngine = new AmbientEngine();

