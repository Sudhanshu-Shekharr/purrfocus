import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AmbientEngine,
  calculateEffectiveGain,
  calculateMasterGain,
  FADE_DURATION_SEC,
  FADE_DURATION_MS,
} from './engine';
import { useAmbientStore } from './store';
import type { LayerSource } from './types';

// Mock Web Audio elements for testing
class MockAudioParam {
  public value: number;
  public ramps: Array<{ type: string; value: number; time: number }> = [];

  constructor(initial = 1) {
    this.value = initial;
  }

  setValueAtTime(val: number, time: number) {
    this.value = val;
    this.ramps.push({ type: 'set', value: val, time });
  }

  linearRampToValueAtTime(val: number, time: number) {
    this.value = val;
    this.ramps.push({ type: 'linear', value: val, time });
  }

  cancelScheduledValues(time: number) {
    this.ramps.push({ type: 'cancel', value: this.value, time });
  }
}

class MockGainNode {
  public gain = new MockAudioParam(1);
  public connectedTo: unknown = null;
  public disconnected = false;

  connect(dest: unknown) {
    this.connectedTo = dest;
    this.disconnected = false;
  }

  disconnect() {
    this.connectedTo = null;
    this.disconnected = true;
  }
}

class MockAudioContext {
  public currentTime = 10.0;
  public state: AudioContextState = 'running';
  public destination = { id: 'destination' };
  public createdGains: MockGainNode[] = [];

  createGain(): GainNode {
    const gain = new MockGainNode();
    this.createdGains.push(gain);
    return gain as unknown as GainNode;
  }

  async resume() {
    this.state = 'running';
  }
}

class MockSynthSource implements LayerSource {
  public id: string;
  public kind = 'synth' as const;
  public isStarted = false;
  public destination: unknown = null;

  constructor(id: string) {
    this.id = id;
  }

  start(_ctx: AudioContext, destination: AudioNode) {
    this.isStarted = true;
    this.destination = destination;
  }

  stop() {
    this.isStarted = false;
    this.destination = null;
  }

  setGain() {}
  dispose() {
    this.stop();
  }

  isConnected(): boolean {
    return this.isStarted && this.destination !== null;
  }
}

describe('AmbientEngine', () => {
  let mockCtx: MockAudioContext;
  let engine: AmbientEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    useAmbientStore.getState().resetMix();
    useAmbientStore.setState({ sessionStarted: false, muted: false, master: 0.7 });

    mockCtx = new MockAudioContext();
    engine = new AmbientEngine(mockCtx as unknown as AudioContext);
    engine.init(() => mockCtx as unknown as AudioContext);
  });

  afterEach(() => {
    engine.dispose();
    vi.useRealTimers();
  });

  describe('Pure Gain Formulas', () => {
    it('calculates effective gain accurately: level * master * (muted ? 0 : 1)', () => {
      expect(calculateEffectiveGain(0.6, 0.7, false)).toBe(0.42);
      expect(calculateEffectiveGain(1.0, 0.5, false)).toBe(0.5);
      expect(calculateEffectiveGain(0.6, 0.7, true)).toBe(0); // Muted produces 0
      expect(calculateEffectiveGain(0, 0.7, false)).toBe(0);
    });

    it('calculates master gain target', () => {
      expect(calculateMasterGain(0.7, false)).toBe(0.7);
      expect(calculateMasterGain(0.7, true)).toBe(0);
      expect(calculateMasterGain(1.0, false)).toBe(1.0);
    });
  });

  describe('Autoplay Gate', () => {
    it('does not create master gain or start playback before user gesture', () => {
      const getterSpy = vi.fn(() => mockCtx as unknown as AudioContext);
      const unmanagedEngine = new AmbientEngine();

      unmanagedEngine.init(getterSpy);
      expect(getterSpy).not.toHaveBeenCalled();
      expect(unmanagedEngine.getActiveLayerGainNodesCount()).toBe(0);

      unmanagedEngine.dispose();
    });

    it('initializes context and begins playing when sessionStarted becomes true', () => {
      const source = new MockSynthSource('rainfall');
      engine.registerSource(source);

      const getterSpy = vi.fn(() => mockCtx as unknown as AudioContext);
      engine.init(getterSpy);

      // User interacts: toggle a layer
      useAmbientStore.getState().setLevel('rainfall', 0.6);

      expect(mockCtx.createdGains.length).toBeGreaterThan(0);
      expect(source.isStarted).toBe(true);
    });
  });

  describe('Fades and Ramps', () => {
    it('schedules linear ramps over 800ms (FADE_DURATION_SEC)', () => {
      const source = new MockSynthSource('soft-piano');
      engine.registerSource(source);
      engine.startEngine();

      useAmbientStore.getState().setLevel('soft-piano', 0.6);

      const layerGain = mockCtx.createdGains[mockCtx.createdGains.length - 1]!;
      expect(layerGain).toBeDefined();

      const lastRamp = layerGain.gain.ramps[layerGain.gain.ramps.length - 1]!;
      expect(lastRamp.type).toBe('linear');
      expect(lastRamp.value).toBe(0.6);
      expect(lastRamp.time).toBeCloseTo(mockCtx.currentTime + FADE_DURATION_SEC, 3);
    });

    it('cancels scheduled values before scheduling a new ramp', () => {
      const source = new MockSynthSource('soft-piano');
      engine.registerSource(source);
      engine.startEngine();

      useAmbientStore.getState().setLevel('soft-piano', 0.6);
      useAmbientStore.getState().setLevel('soft-piano', 0.3);

      const layerGain = mockCtx.createdGains[mockCtx.createdGains.length - 1]!;
      const cancels = layerGain.gain.ramps.filter(r => r.type === 'cancel');
      expect(cancels.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Mute and Unmute', () => {
    it('ramps master gain to 0 on mute and restores master value on unmute', () => {
      engine.startEngine();
      useAmbientStore.getState().setMaster(0.85);

      const masterGain = mockCtx.createdGains[0]!;
      expect(masterGain.gain.value).toBe(0.85);

      // Mute
      useAmbientStore.getState().setMuted(true);
      const muteRamp = masterGain.gain.ramps[masterGain.gain.ramps.length - 1]!;
      expect(muteRamp.value).toBe(0);
      expect(muteRamp.time).toBeCloseTo(mockCtx.currentTime + FADE_DURATION_SEC, 3);

      // Unmute
      useAmbientStore.getState().setMuted(false);
      const unmuteRamp = masterGain.gain.ramps[masterGain.gain.ramps.length - 1]!;
      expect(unmuteRamp.value).toBe(0.85);
    });
  });

  describe('Node Lifecycle and Cleanup at Level 0', () => {
    it('disconnects layer gain node and stops source after 800ms fade', () => {
      const source = new MockSynthSource('brown-noise');
      engine.registerSource(source);
      engine.startEngine();

      useAmbientStore.getState().setLevel('brown-noise', 0.6);
      expect(source.isStarted).toBe(true);
      expect(engine.getActiveLayerGainNodesCount()).toBe(1);

      // Set level to 0
      useAmbientStore.getState().setLevel('brown-noise', 0);

      // Before fade completes (e.g. 400ms), still connected
      vi.advanceTimersByTime(400);
      expect(engine.getActiveLayerGainNodesCount()).toBe(1);
      expect(source.isStarted).toBe(true);

      // After 800ms fade completes, node is disconnected and source stopped
      vi.advanceTimersByTime(FADE_DURATION_MS - 400 + 10);
      expect(source.isStarted).toBe(false);
      expect(engine.getActiveLayerGainNodesCount()).toBe(0);
    });

    it('cancels pending cleanup if layer level is raised before fade completes', () => {
      const source = new MockSynthSource('brown-noise');
      engine.registerSource(source);
      engine.startEngine();

      useAmbientStore.getState().setLevel('brown-noise', 0.6);
      useAmbientStore.getState().setLevel('brown-noise', 0);

      // 300ms in, user changes mind and sets level back to 0.5
      vi.advanceTimersByTime(300);
      useAmbientStore.getState().setLevel('brown-noise', 0.5);

      // Fast-forward past the original 800ms mark
      vi.advanceTimersByTime(1000);

      // Still connected!
      expect(source.isStarted).toBe(true);
      expect(engine.getActiveLayerGainNodesCount()).toBe(1);
    });
  });
});
