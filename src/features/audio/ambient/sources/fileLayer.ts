import { Howl } from 'howler';
import type { AmbientLayerId, LayerSource } from '../types';

export class FileLayerSource implements LayerSource {
  public readonly id: AmbientLayerId;
  public readonly kind = 'file' as const;
  public readonly url: string;
  public readonly isObjectUrl: boolean;
  public readonly displayName: string;

  private howl: Howl | null = null;
  private currentGain = 0;
  private isPlaying = false;

  constructor(id: AmbientLayerId, url: string, displayName = 'Custom Audio') {
    this.id = id;
    this.url = url;
    this.displayName = displayName.slice(0, 40);
    this.isObjectUrl = typeof url === 'string' && url.startsWith('blob:');
  }

  public start(ctx?: AudioContext, destination?: AudioNode): void {
    void ctx;
    void destination;
    if (this.isPlaying && this.howl) {
      return;
    }

    if (!this.howl) {
      this.howl = new Howl({
        src: [this.url],
        loop: true,
        html5: false,
        volume: this.currentGain,
      });
    }

    this.howl.play();
    this.isPlaying = true;
  }

  public stop(): void {
    if (this.howl && this.isPlaying) {
      this.howl.stop();
      this.isPlaying = false;
    }
  }

  public setGain(targetGain: number, fadeDurationSec = 0.8): void {
    const clamped = Math.max(0, Math.min(1, targetGain));
    const prevGain = this.currentGain;
    this.currentGain = clamped;

    if (!this.howl) return;

    if (clamped > 0 && !this.isPlaying) {
      this.howl.volume(prevGain);
      this.howl.play();
      this.isPlaying = true;
    }

    const durationMs = Math.round(fadeDurationSec * 1000);
    if (durationMs > 0 && this.isPlaying) {
      this.howl.fade(prevGain, clamped, durationMs);
    } else {
      this.howl.volume(clamped);
    }

    if (clamped === 0 && this.isPlaying) {
      // Stop playback after fade ends
      setTimeout(() => {
        if (this.currentGain === 0) {
          this.stop();
        }
      }, durationMs);
    }
  }

  public dispose(): void {
    this.stop();
    if (this.howl) {
      this.howl.unload();
      this.howl = null;
    }
    if (this.isObjectUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
      try {
        URL.revokeObjectURL(this.url);
      } catch {
        // Silently ignore revocation errors
      }
    }
  }

  public isConnected(): boolean {
    return this.isPlaying && this.howl !== null;
  }
}
