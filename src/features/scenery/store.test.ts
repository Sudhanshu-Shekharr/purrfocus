import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneryStore } from './store';
import { DEFAULT_SCENE_ID } from '@/data/scenes';
import type { SceneId } from './types';

describe('scenery store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSceneryStore.setState({
      activeSceneId: DEFAULT_SCENE_ID,
      favoriteSceneIds: [],
    });
    localStorage.clear();
  });

  it('initializes with default scene ID', () => {
    const state = useSceneryStore.getState();
    expect(state.activeSceneId).toBe(DEFAULT_SCENE_ID);
    expect(state.favoriteSceneIds).toEqual([]);
  });

  it('updates activeSceneId and sets data-scene on html', () => {
    useSceneryStore.getState().setScene('scene1');
    expect(useSceneryStore.getState().activeSceneId).toBe('scene1');
    expect(document.documentElement.getAttribute('data-scene')).toBe('rain');

    useSceneryStore.getState().setScene('scene5');
    expect(useSceneryStore.getState().activeSceneId).toBe('scene5');
    expect(document.documentElement.getAttribute('data-scene')).toBe('garden');
  });

  it('ignores invalid scene IDs', () => {
    // @ts-expect-error Testing invalid ID runtime safety
    useSceneryStore.getState().setScene('nonexistent');
    expect(useSceneryStore.getState().activeSceneId).toBe(DEFAULT_SCENE_ID);
  });

  it('toggles favorites correctly', () => {
    const { toggleFavorite } = useSceneryStore.getState();

    toggleFavorite('scene2');
    expect(useSceneryStore.getState().favoriteSceneIds).toContain('scene2');

    toggleFavorite('scene3');
    expect(useSceneryStore.getState().favoriteSceneIds).toEqual(['scene2', 'scene3']);

    // Toggling again removes it
    toggleFavorite('scene2');
    expect(useSceneryStore.getState().favoriteSceneIds).toEqual(['scene3']);
  });

  it('recovers from invalid persisted state on rehydration', () => {
    // Simulate corrupt persisted payload in localStorage
    const corruptedPayload = {
      state: {
        activeSceneId: 'hacked-or-stale-scene',
        favoriteSceneIds: ['scene1', 'fake-scene-id', 123],
      },
      version: 1,
    };
    localStorage.setItem('purrfocus:scenery', JSON.stringify(corruptedPayload));

    // Persist storage options rehydration logic test
    const options = (useSceneryStore as unknown as { persist: { getOptions: () => { migrate: (s: unknown) => { activeSceneId: SceneId; favoriteSceneIds: SceneId[] } } } }).persist.getOptions();
    const migrated = options.migrate(corruptedPayload.state);

    expect(migrated.activeSceneId).toBe(DEFAULT_SCENE_ID);
    expect(migrated.favoriteSceneIds).toEqual(['scene1']);
  });
});
