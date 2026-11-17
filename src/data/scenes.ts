import type { Scene, SceneId } from '@/features/scenery/types';

export const SCENES: readonly Scene[] = [
  {
    id: 'scene4',
    name: 'Sunset Cabin',
    tokenSet: 'peach',
    sources: {
      thumb: new URL('../assets/scenes/optimized/scene4-thumb.webp', import.meta.url).href,
      sm: new URL('../assets/scenes/optimized/scene4-sm.webp', import.meta.url).href,
      md: new URL('../assets/scenes/optimized/scene4-md.webp', import.meta.url).href,
    },
    fallbackGradient: 'linear-gradient(135deg, #44322c 0%, #6e4b3b 50%, #2d2626 100%)',
    ambientSuggestion: 'soft-piano',
    timeOfDay: 'evening',
  },
  {
    id: 'scene5',
    name: 'Sunlit Studio',
    tokenSet: 'garden',
    sources: {
      thumb: new URL('../assets/scenes/optimized/scene5-thumb.webp', import.meta.url).href,
      sm: new URL('../assets/scenes/optimized/scene5-sm.webp', import.meta.url).href,
      md: new URL('../assets/scenes/optimized/scene5-md.webp', import.meta.url).href,
    },
    fallbackGradient: 'linear-gradient(135deg, #3d3b2c 0%, #5c4733 50%, #263328 100%)',
    ambientSuggestion: 'soft-piano',
    timeOfDay: 'morning',
  },
  {
    id: 'scene1',
    name: 'Rainy Highrise',
    tokenSet: 'rain',
    sources: {
      thumb: new URL('../assets/scenes/optimized/scene1-thumb.webp', import.meta.url).href,
      sm: new URL('../assets/scenes/optimized/scene1-sm.webp', import.meta.url).href,
      md: new URL('../assets/scenes/optimized/scene1-md.webp', import.meta.url).href,
    },
    fallbackGradient: 'linear-gradient(135deg, #2a2e3d 0%, #463b38 50%, #1e222d 100%)',
    ambientSuggestion: 'rainfall',
    timeOfDay: 'afternoon',
  },
  {
    id: 'scene2',
    name: 'Midnight Nook',
    tokenSet: 'midnight',
    sources: {
      thumb: new URL('../assets/scenes/optimized/scene2-thumb.webp', import.meta.url).href,
      sm: new URL('../assets/scenes/optimized/scene2-sm.webp', import.meta.url).href,
      md: new URL('../assets/scenes/optimized/scene2-md.webp', import.meta.url).href,
    },
    fallbackGradient: 'linear-gradient(135deg, #1f2233 0%, #3d2b2c 50%, #151824 100%)',
    ambientSuggestion: 'soft-piano',
    timeOfDay: 'lateNight',
  },
  {
    id: 'scene3',
    name: 'Late Reading',
    tokenSet: 'nocturne',
    sources: {
      thumb: new URL('../assets/scenes/optimized/scene3-thumb.webp', import.meta.url).href,
      sm: new URL('../assets/scenes/optimized/scene3-sm.webp', import.meta.url).href,
      md: new URL('../assets/scenes/optimized/scene3-md.webp', import.meta.url).href,
    },
    fallbackGradient: 'linear-gradient(135deg, #1b1d2e 0%, #2b3044 50%, #111420 100%)',
    ambientSuggestion: 'brown-noise',
    timeOfDay: 'lateNight',
  },
] as const;

export const DEFAULT_SCENE_ID: SceneId = 'scene4';

export const VALID_SCENE_IDS: readonly SceneId[] = SCENES.map(s => s.id);

export function getSceneById(id: string): Scene {
  const match = SCENES.find(s => s.id === id);
  return match ?? SCENES[0]!;
}
