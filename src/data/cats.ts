export type CatDefinition = {
  id: string;
  name: string;
  breed: string;
  description: string;
  previewColor: string;
  tagline: string;
};

export const CATS: readonly CatDefinition[] = [
  {
    id: 'mochi',
    name: 'Mochi',
    breed: 'Cream Tabby',
    description: 'A soft cream-furred companion who loves warm tea and open books.',
    previewColor: '#FFF5EA',
    tagline: 'Quiet, thoughtful, and steady',
  },
  {
    id: 'chai',
    name: 'Chai',
    breed: 'Warm Calico',
    description: 'A sweet calico with cinnamon spots who loves sunbeams and desk naps.',
    previewColor: '#E29578',
    tagline: 'Curious, cheerful, and cozy',
  },
] as const;

export function getCatDefinition(catId: string): CatDefinition {
  return CATS.find(c => c.id === catId) ?? (CATS[0] as CatDefinition);
}
