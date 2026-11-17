import { describe, it, expect, beforeEach } from 'vitest';
import { useCatStore } from '@/features/cat/store';
import { useSceneryStore } from '@/features/scenery/store';
import { CATS } from '@/data/cats';
import { OUTFITS } from '@/data/outfits';
import { SCENES } from '@/data/scenes';

describe('Unlock All: characters, outfits, and scenes selectable with fresh store', () => {
  beforeEach(() => {
    useCatStore.getState().resetCat();
    useSceneryStore.setState({
      activeSceneId: 'scene4',
      defaultSceneId: 'scene4',
      favoriteSceneIds: [],
    });
  });

  it('allows every character to be selected on a fresh store (bond: 0)', () => {
    expect(useCatStore.getState().bond).toBe(0);

    for (const cat of CATS) {
      useCatStore.getState().setCatId(cat.id);
      expect(useCatStore.getState().catId).toBe(cat.id);
    }
  });

  it('allows every outfit and accessory to be selected on a fresh store (bond: 0)', () => {
    expect(useCatStore.getState().bond).toBe(0);

    for (const outfit of OUTFITS) {
      const outfitValue = outfit.id === 'none' ? null : outfit.id;
      useCatStore.getState().setOutfitId(outfitValue);
      expect(useCatStore.getState().outfitId).toBe(outfitValue);
    }
  });

  it('allows every scene to be selected on a fresh store', () => {
    for (const scene of SCENES) {
      useSceneryStore.getState().setScene(scene.id);
      expect(useSceneryStore.getState().activeSceneId).toBe(scene.id);
    }
  });
});
