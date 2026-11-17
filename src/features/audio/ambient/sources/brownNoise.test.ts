import { describe, it, expect } from 'vitest';
import { generateBrownNoiseBuffer, BrownNoiseSource } from './brownNoise';

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

class MockAudioContext {
  public sampleRate = 44100;
  public createBuffer(_channels: number, length: number, sampleRate: number): AudioBuffer {
    void _channels;
    return new MockAudioBuffer(length, sampleRate) as unknown as AudioBuffer;
  }

  public createBufferSource() {
    return {
      buffer: null as AudioBuffer | null,
      loop: false,
      connectedTo: null as unknown,
      started: false,
      stopped: false,
      connect(dest: unknown) {
        this.connectedTo = dest;
      },
      disconnect() {
        this.connectedTo = null;
      },
      start() {
        this.started = true;
      },
      stop() {
        this.stopped = true;
      },
    };
  }
}

describe('BrownNoiseSource', () => {
  it('generates a 4-second audio buffer with values strictly clamped between -1 and 1', () => {
    const ctx = new MockAudioContext() as unknown as AudioContext;
    const buffer = generateBrownNoiseBuffer(ctx, 4);

    expect(buffer.length).toBe(44100 * 4);
    const data = buffer.getChannelData(0);

    let min = 1;
    let max = -1;
    for (let i = 0; i < data.length; i++) {
      const val = data[i]!;
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
      if (val < min) min = val;
      if (val > max) max = val;
    }
    // Ensures buffer contains real noise variations
    expect(max).toBeGreaterThan(0.05);
    expect(min).toBeLessThan(-0.05);
  });

  it('builds node graph on start and cleans up on stop/dispose', () => {
    const ctx = new MockAudioContext() as unknown as AudioContext;
    const dest = { id: 'destination' } as unknown as AudioNode;
    const source = new BrownNoiseSource();

    expect(source.isConnected()).toBe(false);

    source.start(ctx, dest);
    expect(source.isConnected()).toBe(true);

    source.stop();
    expect(source.isConnected()).toBe(false);

    source.dispose();
    expect(source.isConnected()).toBe(false);
  });
});
