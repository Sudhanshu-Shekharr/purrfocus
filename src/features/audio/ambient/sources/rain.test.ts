import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RainSource, generateWhiteNoiseBuffer } from './rain';

class MockAudioBuffer {
  public length: number;
  public sampleRate: number;
  private channelData: Float32Array;

  constructor(length: number, sampleRate: number) {
    this.length = length;
    this.sampleRate = sampleRate;
    this.channelData = new Float32Array(length);
  }

  getChannelData(): Float32Array {
    return this.channelData;
  }
}

class MockAudioParam {
  public value = 1;
  public ramps: Array<{ type: string; value: number; time: number }> = [];

  setValueAtTime(val: number, time: number) {
    this.value = val;
    this.ramps.push({ type: 'set', value: val, time });
  }

  linearRampToValueAtTime(val: number, time: number) {
    this.value = val;
    this.ramps.push({ type: 'linear', value: val, time });
  }

  exponentialRampToValueAtTime(val: number, time: number) {
    this.value = val;
    this.ramps.push({ type: 'exp', value: val, time });
  }
}

class MockGainNode {
  public gain = new MockAudioParam();
  public connectedTo: unknown = null;
  public isDisconnected = false;

  connect(dest: unknown) {
    this.connectedTo = dest;
    this.isDisconnected = false;
  }

  disconnect() {
    this.connectedTo = null;
    this.isDisconnected = true;
  }
}

class MockOscillatorNode {
  public frequency = new MockAudioParam();
  public type: OscillatorType = 'sine';
  public connectedTo: unknown = null;
  public isStarted = false;
  public isStopped = false;
  public isDisconnected = false;
  public startTime = 0;
  public stopTime = 0;

  connect(dest: unknown) {
    this.connectedTo = dest;
    this.isDisconnected = false;
  }

  disconnect() {
    this.connectedTo = null;
    this.isDisconnected = true;
  }

  start(time = 0) {
    this.isStarted = true;
    this.startTime = time;
  }

  stop(time = 0) {
    this.isStopped = true;
    this.stopTime = time;
  }
}

class MockBiquadFilterNode {
  public frequency = new MockAudioParam();
  public Q = new MockAudioParam();
  public type: BiquadFilterType = 'bandpass';
  public connectedTo: unknown = null;
  public isDisconnected = false;

  connect(dest: unknown) {
    this.connectedTo = dest;
    this.isDisconnected = false;
  }

  disconnect() {
    this.connectedTo = null;
    this.isDisconnected = true;
  }
}

class MockAudioContext {
  public currentTime = 100.0;
  public sampleRate = 44100;
  public createdOscillators: MockOscillatorNode[] = [];
  public createdGains: MockGainNode[] = [];
  public createdFilters: MockBiquadFilterNode[] = [];

  createBuffer(_channels: number, length: number, sampleRate: number): AudioBuffer {
    void _channels;
    return new MockAudioBuffer(length, sampleRate) as unknown as AudioBuffer;
  }

  createBufferSource() {
    return {
      buffer: null as unknown as AudioBuffer,
      loop: false,
      connectedTo: null as unknown,
      isDisconnected: false,
      connect(dest: unknown) {
        this.connectedTo = dest;
        this.isDisconnected = false;
      },
      disconnect() {
        this.connectedTo = null;
        this.isDisconnected = true;
      },
      start() {},
      stop() {},
    };
  }

  createGain(): GainNode {
    const gain = new MockGainNode();
    this.createdGains.push(gain);
    return gain as unknown as GainNode;
  }

  createOscillator(): OscillatorNode {
    const osc = new MockOscillatorNode();
    this.createdOscillators.push(osc);
    return osc as unknown as OscillatorNode;
  }

  createBiquadFilter(): BiquadFilterNode {
    const filter = new MockBiquadFilterNode();
    this.createdFilters.push(filter);
    return filter as unknown as BiquadFilterNode;
  }
}

describe('RainSource', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates a white noise buffer bounded between -1 and 1', () => {
    const ctx = new MockAudioContext() as unknown as AudioContext;
    const buffer = generateWhiteNoiseBuffer(ctx, 4);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < 1000; i++) {
      expect(data[i]).toBeGreaterThanOrEqual(-1);
      expect(data[i]).toBeLessThanOrEqual(1);
    }
  });

  it('builds node graph with bandpass filter (~1200Hz, Q~0.7) and connects on start', () => {
    const mockCtx = new MockAudioContext();
    const dest = { id: 'dest' } as unknown as AudioNode;
    const rain = new RainSource();

    rain.start(mockCtx as unknown as AudioContext, dest);
    expect(rain.isConnected()).toBe(true);

    expect(mockCtx.createdFilters.length).toBeGreaterThan(0);
    const filter = mockCtx.createdFilters[0]!;
    expect(filter.type).toBe('bandpass');
    expect(filter.frequency.value).toBe(1200);
    expect(filter.Q.value).toBe(0.7);

    rain.stop();
    expect(rain.isConnected()).toBe(false);
  });

  it('bounds droplet density to keep CPU low and schedules ahead using currentTime lookahead', () => {
    const mockCtx = new MockAudioContext();
    const dest = { id: 'dest' } as unknown as AudioNode;
    const rain = new RainSource();

    rain.start(mockCtx as unknown as AudioContext, dest);

    // Initial lookahead triggers droplets scheduled in future with AudioContext.currentTime
    expect(mockCtx.createdOscillators.length).toBeGreaterThan(0);
    expect(mockCtx.createdOscillators.length).toBeLessThanOrEqual(6); // Bounded per batch

    for (const osc of mockCtx.createdOscillators) {
      expect(osc.startTime).toBeGreaterThanOrEqual(mockCtx.currentTime);
      expect(osc.stopTime).toBeGreaterThan(osc.startTime);
    }

    // Advancing timers triggers subsequent lookaheads
    vi.advanceTimersByTime(200);
    expect(mockCtx.createdOscillators.length).toBeLessThanOrEqual(20);

    rain.stop();
  });

  it('disconnects and stops all droplets and bed nodes on stop and dispose', () => {
    const mockCtx = new MockAudioContext();
    const dest = { id: 'dest' } as unknown as AudioNode;
    const rain = new RainSource();

    rain.start(mockCtx as unknown as AudioContext, dest);
    expect(rain.isConnected()).toBe(true);

    rain.stop();
    expect(rain.isConnected()).toBe(false);

    // Filter and bed disconnected
    for (const filter of mockCtx.createdFilters) {
      expect(filter.isDisconnected).toBe(true);
    }

    rain.dispose();
  });
});
