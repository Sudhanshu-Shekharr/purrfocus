export type PresetAmbientLayerId = 'soft-piano' | 'rainfall' | 'brown-noise';

export type AmbientLayerId = PresetAmbientLayerId | string;

export type LayerKind = 'synth' | 'file';

export interface LayerSource {
  readonly id: AmbientLayerId;
  readonly kind: LayerKind;
  start(ctx: AudioContext, destination: AudioNode): void;
  stop(): void;
  setGain(targetGain: number, fadeDurationSec?: number): void;
  dispose(): void;
  isConnected(): boolean;
}

export interface AmbientPersistedState {
  levels: Record<string, number>;
  master: number;
  muted: boolean;
}

export interface AmbientActions {
  setLevel: (layerId: AmbientLayerId, level: number, markStarted?: boolean) => void;
  toggleLayer: (layerId: AmbientLayerId) => void;
  selectSound: (layerId: AmbientLayerId) => void;
  setMaster: (master: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setSessionStarted: (started?: boolean) => void;
  togglePlayback: () => void;
  resetMix: () => void;
}

export interface AmbientStoreState extends AmbientPersistedState, AmbientActions {
  /**
   * Session-only flag tracking whether user has interacted to start playback this session.
   * NOT persisted to localStorage (prevents autoplay on reload).
   */
  sessionStarted: boolean;
}
