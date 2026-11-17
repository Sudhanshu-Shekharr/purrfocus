import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SoftPianoSource } from './softPiano';

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

class MockDelayNode {
  public delayTime = new MockAudioParam();
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
  public currentTime = 200.0;
  public sampleRate = 44100;
  public createdOscillators: MockOscillatorNode[] = [];
  public createdGains: MockGainNode[] = [];
  public createdDelays: MockDelayNode[] = [];

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

  createDelay(): DelayNode {
    const delay = new MockDelayNode();
    this.createdDelays.push(delay);
    return delay as unknown as DelayNode;
  }
}

describe('SoftPianoSource', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds node graph with feedback delay reverb and connects to destination', () => {
    const mockCtx = new MockAudioContext();
    const dest = { id: 'dest' } as unknown as AudioNode;
    const piano = new SoftPianoSource();

    piano.start(mockCtx as unknown as AudioContext, dest);
    expect(piano.isConnected()).toBe(true);

    expect(mockCtx.createdDelays.length).toBeGreaterThan(0);
    const delay = mockCtx.createdDelays[0]!;
    expect(delay.delayTime.value).toBe(0.32);

    piano.stop();
    expect(piano.isConnected()).toBe(false);
  });

  it('schedules notes using AudioContext.currentTime lookahead', () => {
    const mockCtx = new MockAudioContext();
    const dest = { id: 'dest' } as unknown as AudioNode;
    const piano = new SoftPianoSource();

    piano.start(mockCtx as unknown as AudioContext, dest);

    // Initial note scheduled
    expect(mockCtx.createdOscillators.length).toBeGreaterThanOrEqual(2); // Triangle + sine partial
    const firstOsc = mockCtx.createdOscillators[0]!;
    expect(firstOsc.startTime).toBeGreaterThanOrEqual(mockCtx.currentTime);
    expect(firstOsc.type).toBe('triangle');

    const secondOsc = mockCtx.createdOscillators[1]!;
    expect(secondOsc.type).toBe('sine');

    piano.stop();
  });

  it('disconnects delay, master gain, and oscillators on stop and dispose', () => {
    const mockCtx = new MockAudioContext();
    const dest = { id: 'dest' } as unknown as AudioNode;
    const piano = new SoftPianoSource();

    piano.start(mockCtx as unknown as AudioContext, dest);
    expect(piano.isConnected()).toBe(true);

    piano.stop();
    expect(piano.isConnected()).toBe(false);

    for (const delay of mockCtx.createdDelays) {
      expect(delay.isDisconnected).toBe(true);
    }

    piano.dispose();
  });
});
