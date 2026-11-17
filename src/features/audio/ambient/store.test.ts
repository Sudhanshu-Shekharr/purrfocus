import { describe, it, expect, beforeEach } from 'vitest';
import {
  useAmbientStore,
  sanitizeAmbientState,
  selectIsAudible,
  selectEffectiveGain,
  AMBIENT_STORAGE_KEY,
  DEFAULT_MASTER,
  DEFAULT_LAYER_LEVEL,
} from './store';

describe('useAmbientStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAmbientStore.getState().resetMix();
    useAmbientStore.setState({ sessionStarted: false, muted: false, master: DEFAULT_MASTER });
  });

  it('initializes with default values and sessionStarted false', () => {
    const state = useAmbientStore.getState();
    expect(state.master).toBe(DEFAULT_MASTER);
    expect(state.muted).toBe(false);
    expect(state.sessionStarted).toBe(false);
    expect(state.levels['soft-piano']).toBe(0);
    expect(state.levels['rainfall']).toBe(0);
    expect(state.levels['brown-noise']).toBe(0);
  });

  it('persists levels, master, and muted, but NOT sessionStarted', () => {
    useAmbientStore.getState().setLevel('rainfall', 0.65);
    useAmbientStore.getState().setMaster(0.85);
    useAmbientStore.getState().setMuted(true);
    useAmbientStore.getState().setSessionStarted(true);

    const raw = localStorage.getItem(AMBIENT_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);

    expect(parsed.state.levels.rainfall).toBe(0.65);
    expect(parsed.state.master).toBe(0.85);
    expect(parsed.state.muted).toBe(true);
    expect(parsed.state.sessionStarted).toBeUndefined();
  });

  it('toggleLayer turns layer on (0.6) and off (0)', () => {
    const store = useAmbientStore.getState();
    expect(store.levels['soft-piano']).toBe(0);

    store.toggleLayer('soft-piano');
    expect(useAmbientStore.getState().levels['soft-piano']).toBe(DEFAULT_LAYER_LEVEL);
    expect(useAmbientStore.getState().sessionStarted).toBe(true);

    useAmbientStore.getState().toggleLayer('soft-piano');
    expect(useAmbientStore.getState().levels['soft-piano']).toBe(0);
  });

  it('toggleMute toggles muted state and quick mute restores master value', () => {
    useAmbientStore.getState().setMaster(0.75);
    useAmbientStore.getState().toggleMute();
    expect(useAmbientStore.getState().muted).toBe(true);
    expect(useAmbientStore.getState().master).toBe(0.75);

    useAmbientStore.getState().toggleMute();
    expect(useAmbientStore.getState().muted).toBe(false);
    expect(useAmbientStore.getState().master).toBe(0.75);
  });

  it('selectIsAudible only returns true when session has started, not muted, and level > 0', () => {
    useAmbientStore.getState().setLevel('soft-piano', 0.5);
    // sessionStarted was set to true on level > 0
    expect(selectIsAudible(useAmbientStore.getState())).toBe(true);

    // Muted -> not audible
    useAmbientStore.getState().setMuted(true);
    expect(selectIsAudible(useAmbientStore.getState())).toBe(false);

    // Unmute -> audible
    useAmbientStore.getState().setMuted(false);
    expect(selectIsAudible(useAmbientStore.getState())).toBe(true);

    // Session not started (e.g. simulated reload before click) -> not audible
    useAmbientStore.setState({ sessionStarted: false });
    expect(selectIsAudible(useAmbientStore.getState())).toBe(false);
  });

  it('selectEffectiveGain computes level * master when active and 0 when muted or inactive', () => {
    useAmbientStore.setState({ sessionStarted: true, muted: false, master: 0.8 });
    useAmbientStore.getState().setLevel('rainfall', 0.5);

    expect(selectEffectiveGain(useAmbientStore.getState(), 'rainfall')).toBe(0.4);

    useAmbientStore.getState().setMuted(true);
    expect(selectEffectiveGain(useAmbientStore.getState(), 'rainfall')).toBe(0);

    useAmbientStore.setState({ sessionStarted: false, muted: false });
    expect(selectEffectiveGain(useAmbientStore.getState(), 'rainfall')).toBe(0);
  });

  it('togglePlayback toggles mute if audible, or starts default preset if empty', () => {
    // Case 1: All layers off
    useAmbientStore.setState({ sessionStarted: false, levels: { 'soft-piano': 0 } });
    useAmbientStore.getState().togglePlayback();
    expect(useAmbientStore.getState().sessionStarted).toBe(true);
    expect(useAmbientStore.getState().levels['soft-piano']).toBe(DEFAULT_LAYER_LEVEL);
    expect(useAmbientStore.getState().muted).toBe(false);

    // Case 2: Currently playing -> toggles to muted
    useAmbientStore.getState().togglePlayback();
    expect(useAmbientStore.getState().muted).toBe(true);

    // Case 3: Currently muted -> un-mutes
    useAmbientStore.getState().togglePlayback();
    expect(useAmbientStore.getState().muted).toBe(false);
  });

  it('sanitizeAmbientState clamps malformed input safely', () => {
    const sanitized = sanitizeAmbientState({
      levels: { 'soft-piano': 5.2, rainfall: -0.3, custom: 'bad' },
      master: 1.8,
      muted: 'invalid',
    });

    expect(sanitized.levels['soft-piano']).toBe(1);
    expect(sanitized.levels['rainfall']).toBe(0);
    expect(sanitized.master).toBe(1);
    expect(sanitized.muted).toBe(false);
  });
});
