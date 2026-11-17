export type CollectibleId = 'tea-mug' | 'plant' | 'lamp' | 'photo-frame' | 'bookmark';

export type Collectible = {
  id: CollectibleId;
  name: string;
  description: string;
  unlockRequirement: string;
};

export const COLLECTIBLES: readonly Collectible[] = [
  {
    id: 'tea-mug',
    name: 'Cozy Ceramic Mug',
    description: 'A warm glazed ceramic mug of chamomile tea.',
    unlockRequirement: 'Complete 60 focus minutes',
  },
  {
    id: 'plant',
    name: 'Potted Pothos',
    description: 'A small trailing pothos plant sitting comfortably on the desk.',
    unlockRequirement: 'Complete 120 focus minutes',
  },
  {
    id: 'lamp',
    name: 'Soft Glow Desk Lamp',
    description: 'An amber brass lamp casting a warm circle of evening light.',
    unlockRequirement: 'Complete 240 focus minutes',
  },
  {
    id: 'photo-frame',
    name: 'Mini Wooden Frame',
    description: 'A tiny wooden frame holding a memory of a peaceful afternoon.',
    unlockRequirement: 'Complete 480 focus minutes',
  },
  {
    id: 'bookmark',
    name: 'Pressed Blossom Bookmark',
    description: 'A delicate pressed flower bookmark saved from a sunny day.',
    unlockRequirement: 'Reach a 3-day focus streak',
  },
] as const;

export function getCollectibleById(id: CollectibleId): Collectible | undefined {
  return COLLECTIBLES.find(c => c.id === id);
}
