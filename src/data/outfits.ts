import type { BondLevel } from '@/features/cat/types';

export type OutfitDefinition = {
  id: string;
  name: string;
  description: string;
  unlockAtLevel: BondLevel;
  previewEmoji: string;
};

export const OUTFITS: readonly OutfitDefinition[] = [
  {
    id: 'none',
    name: 'Natural Fur',
    description: 'Au naturel, classic soft fur with no accessories.',
    unlockAtLevel: 'stranger',
    previewEmoji: '🐾',
  },
  {
    id: 'glasses',
    name: 'Wire Glasses',
    description: 'Round wire spectacles for deep study sessions.',
    unlockAtLevel: 'stranger',
    previewEmoji: '👓',
  },
  {
    id: 'scarf',
    name: 'Cozy Knit Scarf',
    description: 'A warm woolen scarf wrapped snug around the neck.',
    unlockAtLevel: 'friend',
    previewEmoji: '🧣',
  },
  {
    id: 'beanie',
    name: 'Slouchy Beanie',
    description: 'A soft ribbed knit beanie for chilly autumn days.',
    unlockAtLevel: 'friend',
    previewEmoji: '🧶',
  },
  {
    id: 'bow',
    name: 'Silk Ribbon Bow',
    description: 'A dainty satin ribbon tied neatly under the chin.',
    unlockAtLevel: 'best_friend',
    previewEmoji: '🎀',
  },
  {
    id: 'headphones',
    name: 'Studio Headphones',
    description: 'Over-ear headphones tuned to soft lo-fi beats.',
    unlockAtLevel: 'family',
    previewEmoji: '🎧',
  },
] as const;

export function getOutfitDefinition(outfitId: string | null): OutfitDefinition {
  if (!outfitId || outfitId === 'none') {
    return OUTFITS[0] as OutfitDefinition;
  }
  return OUTFITS.find(o => o.id === outfitId) ?? (OUTFITS[0] as OutfitDefinition);
}
