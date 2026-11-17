import { fx } from './fx';

export const SCENE_PETAL_PALETTES: Record<string, string[]> = {
  // Peach / Sunset Cabin: warm coral, peach, soft blush
  peach: ['#F4A261', '#E76F51', '#F8BBD0', '#FFD1B3', '#FFAA85'],
  scene4: ['#F4A261', '#E76F51', '#F8BBD0', '#FFD1B3', '#FFAA85'],

  // Garden / Sunlit Studio: sage leaf green, soft sunlight butter, pastel teal
  garden: ['#81B29A', '#E9C46A', '#A8DADC', '#D8E2DC', '#C1DFD1'],
  scene5: ['#81B29A', '#E9C46A', '#A8DADC', '#D8E2DC', '#C1DFD1'],

  // Rain / Rainy Highrise: sky dew, misty lavender, cool water drops
  rain: ['#8ECAE6', '#BDE0FE', '#A2D2FF', '#DCEBFA', '#C5D3E8'],
  scene1: ['#8ECAE6', '#BDE0FE', '#A2D2FF', '#DCEBFA', '#C5D3E8'],

  // Midnight / Midnight Nook: soft amethyst, dusk rose, muted plum
  midnight: ['#B392AC', '#E8C2CA', '#D1B3C4', '#E0B1CB', '#F7D6E0'],
  scene2: ['#B392AC', '#E8C2CA', '#D1B3C4', '#E0B1CB', '#F7D6E0'],

  // Nocturne / Late Reading: deep evening violet, starry mauve, soft cream
  nocturne: ['#9C89B8', '#F0A6CA', '#EFC3E6', '#D6C7E8', '#F0E6EF'],
  scene3: ['#9C89B8', '#F0A6CA', '#EFC3E6', '#D6C7E8', '#F0E6EF'],
};

const DEFAULT_PALETTE = ['#F4A261', '#E76F51', '#F8BBD0', '#FFD1B3'];

/**
 * Returns scene-tinted soft petal colors for celebrate confetti-lite.
 */
export function getScenePetalColors(sceneKey?: string): string[] {
  if (!sceneKey) return DEFAULT_PALETTE;
  return SCENE_PETAL_PALETTES[sceneKey] ?? DEFAULT_PALETTE;
}

/**
 * Confetti-lite celebration:
 * 14–18 petals falling gently across the cat card region over ~2.5s.
 * Colors are derived from the active scene tint.
 */
export function triggerCelebratePetals(
  rect: { left: number; top: number; width: number; height: number },
  sceneKey?: string,
): void {
  const colors = getScenePetalColors(sceneKey);
  const petalCount = 16; // 14–18 petals

  // Distribute across top of cat card
  for (let i = 0; i < petalCount; i++) {
    const fraction = (i + Math.random() * 0.5) / petalCount;
    const x = rect.left + fraction * rect.width;
    const y = rect.top - 10 - Math.random() * 30; // start slightly above top edge

    fx.emit('burst', {
      kind: 'petal',
      x,
      y,
      count: 1,
      spread: 6,
      colors,
    });
  }
}
