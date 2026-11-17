import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SceneId } from './types';
import { DEFAULT_SCENE_ID, VALID_SCENE_IDS, getSceneById } from '@/data/scenes';

export type SceneryState = {
  activeSceneId: SceneId;
  defaultSceneId: SceneId;
  favoriteSceneIds: SceneId[];
  setScene: (id: SceneId) => void;
  setDefaultScene: (id: SceneId) => void;
  toggleFavorite: (id: SceneId) => void;
};

function isValidSceneId(id: unknown): id is SceneId {
  return typeof id === 'string' && VALID_SCENE_IDS.includes(id as SceneId);
}

function syncHtmlDataScene(sceneId: SceneId): void {
  if (typeof document !== 'undefined') {
    const scene = getSceneById(sceneId);
    document.documentElement.setAttribute('data-scene', scene.tokenSet);
  }
}

export const useSceneryStore = create<SceneryState>()(
  persist(
    (set, get) => ({
      activeSceneId: DEFAULT_SCENE_ID,
      defaultSceneId: DEFAULT_SCENE_ID,
      favoriteSceneIds: [],

      setScene: (id: SceneId) => {
        if (!isValidSceneId(id)) return;
        syncHtmlDataScene(id);
        set({ activeSceneId: id });
      },

      setDefaultScene: (id: SceneId) => {
        if (!isValidSceneId(id)) return;
        set({ defaultSceneId: id });
      },

      toggleFavorite: (id: SceneId) => {
        if (!isValidSceneId(id)) return;
        const current = get().favoriteSceneIds;
        const isFav = current.includes(id);
        const next = isFav ? current.filter(item => item !== id) : [...current, id];
        set({ favoriteSceneIds: next });
      },
    }),
    {
      name: 'purrfocus:scenery',
      version: 1,
      // Validate and sanitize persisted state on rehydration
      migrate: (persistedState: unknown) => {
        const state = persistedState as Partial<SceneryState> | undefined;
        const defaultSceneId = isValidSceneId(state?.defaultSceneId)
          ? state.defaultSceneId
          : DEFAULT_SCENE_ID;
        const activeSceneId = isValidSceneId(state?.activeSceneId)
          ? state.activeSceneId
          : defaultSceneId;
        const favoriteSceneIds = Array.isArray(state?.favoriteSceneIds)
          ? state.favoriteSceneIds.filter(isValidSceneId)
          : [];
        return {
          activeSceneId,
          defaultSceneId,
          favoriteSceneIds,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!isValidSceneId(state.defaultSceneId)) {
            state.defaultSceneId = DEFAULT_SCENE_ID;
          }
          if (!isValidSceneId(state.activeSceneId)) {
            state.activeSceneId = state.defaultSceneId;
          }
          if (!Array.isArray(state.favoriteSceneIds)) {
            state.favoriteSceneIds = [];
          } else {
            state.favoriteSceneIds = state.favoriteSceneIds.filter(isValidSceneId);
          }
          syncHtmlDataScene(state.activeSceneId);
        }
      },
    },
  ),
);

// Apply initial attribute in browser environment
if (typeof document !== 'undefined') {
  const current = useSceneryStore.getState().activeSceneId;
  syncHtmlDataScene(current);
}
