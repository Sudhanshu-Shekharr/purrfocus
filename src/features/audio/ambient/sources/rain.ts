import type { LayerSource } from '../types';

let cachedRainNoiseBuffer: AudioBuffer | null = null;
let cachedRainSampleRate: number | null = null;

export function generateWhiteNoiseBuffer(ctx: AudioContext, durationSeconds = 4): AudioBuffer {
  const sampleRate = ctx.sampleRate || 44100;
  if (cachedRainNoiseBuffer && cachedRainSampleRate === sampleRate) {
    return cachedRainNoiseBuffer;
  }

  const length = Math.floor(sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  cachedRainNoiseBuffer = buffer;
  cachedRainSampleRate = sampleRate;
  return buffer;
}

export class RainSource implements LayerSource {
  public readonly id = 'rainfall';
  public readonly kind = 'synth' as const;

  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private bedGainNode: GainNode | null = null;

  private isRunning = false;
  private nextDropletTime = 0;
  private lookaheadTimer: ReturnType<typeof setTimeout> | null = null;
  private activeDropletNodes: Array<{ osc: OscillatorNode; gain: GainNode }> = [];

  public start(ctx: AudioContext, destination: AudioNode): void {
    if (this.isRunning) return;

    this.ctx = ctx;
    this.destination = destination;
    this.isRunning = true;

    // 1. Continuous band-pass filtered noise bed (~1.2 kHz, Q ~0.7)
    const noiseBuffer = generateWhiteNoiseBuffer(ctx);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.Q.setValueAtTime(0.7, ctx.currentTime);

    const bedGain = ctx.createGain();
    bedGain.gain.setValueAtTime(0.35, ctx.currentTime);

    noise.connect(filter);
    filter.connect(bedGain);
    bedGain.connect(destination);

    noise.start();

    this.noiseSource = noise;
    this.filterNode = filter;
    this.bedGainNode = bedGain;

    // 2. Start lookahead scheduler for sparse rain droplets
    this.nextDropletTime = ctx.currentTime + 0.05;
    this.scheduleDroplets();
  }

  private scheduleDroplets = (): void => {
    if (!this.isRunning || !this.ctx || !this.destination) return;

    const scheduleAheadWindow = 0.25; // 250ms lookahead
    const now = this.ctx.currentTime;
    let scheduledCount = 0;
    const maxDropletsPerBatch = 6; // Strict upper bound for low CPU

    while (this.nextDropletTime < now + scheduleAheadWindow && scheduledCount < maxDropletsPerBatch) {
      this.playDropletAtTime(this.nextDropletTime);
      // Interval between 40ms and 200ms
      const intervalSec = 0.04 + Math.random() * 0.16;
      this.nextDropletTime += intervalSec;
      scheduledCount++;
    }

    // Schedule next lookahead check in 100ms
    this.lookaheadTimer = setTimeout(this.scheduleDroplets, 100);
  };

  private playDropletAtTime(time: number): void {
    if (!this.ctx || !this.destination) return;

    const attack = 0.002 + Math.random() * 0.004; // 2-6ms attack
    const decay = 0.03 + Math.random() * 0.05; // 30-80ms decay
    const duration = attack + decay;

    // Random droplet frequency between 1400Hz and 3600Hz
    const freq = 1400 + Math.random() * 2200;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    // Slight pitch drop on droplet hit
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, time + duration);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.06, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.destination);

    osc.start(time);
    osc.stop(time + duration);

    const nodeRef = { osc, gain };
    this.activeDropletNodes.push(nodeRef);

    // Clean up node references after droplet finishes playing
    const delayMs = Math.max(10, Math.floor((time + duration - this.ctx.currentTime) * 1000) + 50);
    setTimeout(() => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // Silently catch
      }
      const idx = this.activeDropletNodes.indexOf(nodeRef);
      if (idx !== -1) {
        this.activeDropletNodes.splice(idx, 1);
      }
    }, delayMs);
  }

  public stop(): void {
    this.isRunning = false;

    if (this.lookaheadTimer) {
      clearTimeout(this.lookaheadTimer);
      this.lookaheadTimer = null;
    }

    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch {
        // Silently catch
      }
      this.noiseSource = null;
    }

    if (this.filterNode) {
      try {
        this.filterNode.disconnect();
      } catch {
        // Silently catch
      }
      this.filterNode = null;
    }

    if (this.bedGainNode) {
      try {
        this.bedGainNode.disconnect();
      } catch {
        // Silently catch
      }
      this.bedGainNode = null;
    }

    for (const { osc, gain } of this.activeDropletNodes) {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch {
        // Silently catch
      }
    }
    this.activeDropletNodes = [];
    this.destination = null;
  }

  public setGain(): void {}

  public dispose(): void {
    this.stop();
    this.ctx = null;
  }

  public isConnected(): boolean {
    return this.isRunning && this.destination !== null;
  }
}
