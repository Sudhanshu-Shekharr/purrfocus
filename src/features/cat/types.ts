export type PoseId =
  | 'idle_happy'
  | 'study_book'
  | 'study_write'
  | 'study_laptop'
  | 'break_tea'
  | 'break_nap'
  | 'stretch'
  | 'pet_happy'
  | 'play'
  | 'treat'
  | 'celebrate'
  | 'sleepy'
  | 'sad_gentle';

export type Mood = 'happy' | 'focused' | 'sleepy' | 'proud' | 'cozy';

export type BondLevel = 'stranger' | 'friend' | 'best_friend' | 'family';

export type InteractionBondEntry = {
  timestamp: number;
  points: number;
};

export type CatState = {
  name: string;                // default "Mochi"; trimmed, 1–20 chars
  catId: string;               // from cats.ts
  outfitId: string | null;     // from outfits.ts; null = no outfit
  bond: number;                // points; grows with focus time and interactions
  studyPoseVariant: 0 | 1 | 2; // cycles study_book / study_write / study_laptop
  lastInteractionAt: number;   // epoch ms
  interactionBondHistory: InteractionBondEntry[];
};

export type OverlayType =
  | 'celebrate'
  | 'sad_gentle'
  | 'pet_happy'
  | 'play'
  | 'treat'
  | 'stretch';

export type CatOverlay = {
  type: OverlayType;
  pose: PoseId;
  until: number; // epoch ms
};
