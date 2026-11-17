import type { LayerSource } from '../types';

let cachedBuffer: AudioBuffer | null = null;
let cachedSampleRate: number | null = null;

export function generateBrownNoiseBuffer(ctx: AudioContext, durationSeconds = 4): AudioBuffer {
  const sampleRate = ctx.sampleRate || 44100;
  if (cachedBuffer && cachedSampleRate === sampleRate) {
    return cachedBuffer;
  }

  const length = Math.floor(sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    // Leaky integrator filter formula
    last = (last + 0.02 * white) / 1.02;
    // Gain x3.5, strictly clamped to [-1, 1]
    const clamped = Math.max(-1, Math.min(1, last * 3.5));
    data[i] = clamped;
  }

  cachedBuffer = buffer;
  cachedSampleRate = sampleRate;
  return buffer;
}

export class BrownNoiseSource implements LayerSource {
  public readonly id = 'brown-noise';
  public readonly kind = 'synth' as const;

  private sourceNode: AudioBufferSourceNode | null = null;
  private destination: AudioNode | null = null;

  public start(ctx: AudioContext, destination: AudioNode): void {
    if (this.sourceNode) {
      return;
    }

    this.destination = destination;

    const buffer = generateBrownNoiseBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    source.connect(destination);
    source.start();
    this.sourceNode = source;
  }

  public stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {
        // Silently ignore if already stopped
      }
      this.sourceNode = null;
    }
    this.destination = null;
  }

  public setGain(): void {
    // Synth sources are scaled by the engine's GainNode
  }

  public dispose(): void {
    this.stop();
  }

  public isConnected(): boolean {
    return this.sourceNode !== null && this.destination !== null;
  }
}
