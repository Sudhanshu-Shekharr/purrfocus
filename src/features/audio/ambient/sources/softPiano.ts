import type { LayerSource } from '../types';

// Pentatonic scale notes (in Hz): C4, D4, E4, G4, A4
const PENTATONIC_FREQUENCIES: readonly number[] = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.0, // G4
  440.0, // A4
];

const LOOP_DURATION_SEC = 16.0;
const NOTE_INTERVAL_SEC = LOOP_DURATION_SEC / PENTATONIC_FREQUENCIES.length; // 3.2s per note

export class SoftPianoSource implements LayerSource {
  public readonly id = 'soft-piano';
  public readonly kind = 'synth' as const;

  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private pianoMasterGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;

  private isRunning = false;
  private nextNoteTime = 0;
  private currentNoteIndex = 0;
  private schedulerTimer: ReturnType<typeof setTimeout> | null = null;
  private activeNoteNodes: Array<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode }> = [];

  public start(ctx: AudioContext, destination: AudioNode): void {
    if (this.isRunning) return;

    this.ctx = ctx;
    this.destination = destination;
    this.isRunning = true;

    // 1. Piano bus & Reverb approximation via feedback delay at 0.25 gain
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.5, ctx.currentTime);

    const delay = ctx.createDelay();
    delay.delayTime.setValueAtTime(0.32, ctx.currentTime);

    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.25, ctx.currentTime);

    // Wire feedback loop: delay -> feedback -> delay
    delay.connect(feedback);
    feedback.connect(delay);

    // Send dry & wet to master
    delay.connect(master);
    master.connect(destination);

    this.pianoMasterGain = master;
    this.delayNode = delay;
    this.feedbackGain = feedback;

    // 2. Start lookahead note scheduler
    this.nextNoteTime = ctx.currentTime + 0.1;
    this.currentNoteIndex = 0;
    this.scheduleNotes();
  }

  private scheduleNotes = (): void => {
    if (!this.isRunning || !this.ctx || !this.pianoMasterGain || !this.delayNode) return;

    const scheduleWindowSec = 0.5; // 500ms lookahead
    const now = this.ctx.currentTime;

    while (this.nextNoteTime < now + scheduleWindowSec) {
      const freq = PENTATONIC_FREQUENCIES[this.currentNoteIndex % PENTATONIC_FREQUENCIES.length]!;
      this.playNoteAtTime(freq, this.nextNoteTime);

      this.nextNoteTime += NOTE_INTERVAL_SEC;
      this.currentNoteIndex++;
    }

    this.schedulerTimer = setTimeout(this.scheduleNotes, 200);
  };

  private playNoteAtTime(frequency: number, time: number): void {
    if (!this.ctx || !this.pianoMasterGain || !this.delayNode) return;

    const attack = 0.04;
    const release = 2.5;
    const duration = attack + release;

    // Fundamental soft triangle tone
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(frequency, time);

    // 2x Sine partial for acoustic warmth
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, time);

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.linearRampToValueAtTime(0.28, time + attack);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Partial gain
    const partialGain = this.ctx.createGain();
    partialGain.gain.setValueAtTime(0.35, time);

    osc1.connect(noteGain);
    osc2.connect(partialGain);
    partialGain.connect(noteGain);

    // Connect note to dry piano bus and to delay reverb
    noteGain.connect(this.pianoMasterGain);
    noteGain.connect(this.delayNode);

    osc1.start(time);
    osc1.stop(time + duration);
    osc2.start(time);
    osc2.stop(time + duration);

    const nodeRef = { osc1, osc2, gain: noteGain };
    this.activeNoteNodes.push(nodeRef);

    const delayMs = Math.max(10, Math.floor((time + duration - this.ctx.currentTime) * 1000) + 100);
    setTimeout(() => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        partialGain.disconnect();
        noteGain.disconnect();
      } catch {
        // Silently catch
      }
      const idx = this.activeNoteNodes.indexOf(nodeRef);
      if (idx !== -1) {
        this.activeNoteNodes.splice(idx, 1);
      }
    }, delayMs);
  }

  public stop(): void {
    this.isRunning = false;

    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    for (const { osc1, osc2, gain } of this.activeNoteNodes) {
      try {
        osc1.stop();
        osc1.disconnect();
        osc2.stop();
        osc2.disconnect();
        gain.disconnect();
      } catch {
        // Silently catch
      }
    }
    this.activeNoteNodes = [];

    if (this.delayNode) {
      try {
        this.delayNode.disconnect();
      } catch {
        // Silently catch
      }
      this.delayNode = null;
    }

    if (this.feedbackGain) {
      try {
        this.feedbackGain.disconnect();
      } catch {
        // Silently catch
      }
      this.feedbackGain = null;
    }

    if (this.pianoMasterGain) {
      try {
        this.pianoMasterGain.disconnect();
      } catch {
        // Silently catch
      }
      this.pianoMasterGain = null;
    }

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
