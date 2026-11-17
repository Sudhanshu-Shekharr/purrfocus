import React from 'react';
import { GlassCard } from '@/components/ui';
import { CatEyebrow, CatCaption } from './CatCaption';
import { ThoughtBubble } from './ThoughtBubble';
import { CatStage } from './CatStage';
import { CatNameEditor } from './CatNameEditor';
import { CatControls } from './CatControls';
import { useCatEngine } from '@/features/cat/useCatEngine';
import { useCatStore } from '@/features/cat/store';
import { getCatDefinition } from '@/data/cats';
import { getOutfitDefinition } from '@/data/outfits';

export type CatCompanionProps = {
  className?: string;
};

export const CatCompanion: React.FC<CatCompanionProps> = ({ className = '' }) => {
  // Mount background engine listeners (idle, events, wake)
  useCatEngine();
  const catId = useCatStore(s => s.catId);
  const outfitId = useCatStore(s => s.outfitId);
  const catDef = getCatDefinition(catId);
  const outfitDef = getOutfitDefinition(outfitId);

  return (
    <GlassCard
      id="cat-companion-card"
      padding="lg"
      className={`w-full flex flex-col items-center text-center relative ${className}`}
    >
      {/* 1. Header status eyebrow */}
      <CatEyebrow className="mb-3" />

      {/* 2. Dynamic thought bubble */}
      <ThoughtBubble className="mb-2" />

      {/* 3. Cat sprite stage */}
      <CatStage />

      {/* 4. Name & Caption */}
      <div className="mb-4 flex flex-col items-center">
        <CatNameEditor />
        <span className="font-sans text-xs text-ink-500 font-medium">
          {catDef.breed}
          {outfitId && outfitId !== 'none' ? ` · ${outfitDef.name}` : ''}
        </span>
        <CatCaption className="mt-0.5" />
      </div>

      {/* 5. Cat Controls: Outfit sheet button + Pet, Play, More menu */}
      <CatControls />
    </GlassCard>
  );
};

export default CatCompanion;
