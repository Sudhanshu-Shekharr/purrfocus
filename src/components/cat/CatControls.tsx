import React, { useState } from 'react';
import { Shirt, Heart, Play, MoreHorizontal } from 'lucide-react';
import { PillButton } from '@/components/ui';
import { useCatRuntimeStore } from '@/features/cat/controller';
import { MoreMenu } from './MoreMenu';
import { OutfitSheet } from './OutfitSheet';

export const CatControls: React.FC = () => {
  const [isOutfitOpen, setIsOutfitOpen] = useState(false);

  const pet = useCatRuntimeStore(s => s.pet);
  const play = useCatRuntimeStore(s => s.play);

  return (
    <>
      {/* 1. Change cat & outfit button */}
      <PillButton
        variant="glass"
        size="md"
        type="button"
        leftIcon={<Shirt className="h-4 w-4 text-ink-700 shrink-0" />}
        className="w-full mb-3.5 shadow-sm whitespace-nowrap px-4 sm:px-5"
        aria-label="Change cat & outfit"
        onClick={() => setIsOutfitOpen(true)}
      >
        <span>Change cat & outfit</span>
      </PillButton>

      {/* 2. Action buttons: Pet, Play, More */}
      <div className="flex items-center justify-center gap-2 w-full pt-3.5 border-t border-glass-border/40">
        <PillButton
          variant="glass"
          size="sm"
          type="button"
          leftIcon={<Heart className="h-3.5 w-3.5 text-accent fill-accent/20" />}
          className="text-small px-3.5 min-h-[44px] min-w-[44px]"
          onClick={() => pet()}
          aria-label="Pet cat"
        >
          Pet
        </PillButton>

        <PillButton
          variant="glass"
          size="sm"
          type="button"
          leftIcon={<Play className="h-3.5 w-3.5 text-ink-700" />}
          className="text-small px-3.5 min-h-[44px] min-w-[44px]"
          onClick={() => play()}
          aria-label="Play with yarn ball"
        >
          Play
        </PillButton>

        <MoreMenu
          trigger={
            <PillButton
              variant="glass"
              size="sm"
              type="button"
              leftIcon={<MoreHorizontal className="h-3.5 w-3.5 text-ink-700" />}
              className="text-small px-3.5 min-h-[44px] min-w-[44px]"
              aria-label="More cat options"
            >
              More
            </PillButton>
          }
        />
      </div>

      {/* Outfit Modal Sheet */}
      <OutfitSheet open={isOutfitOpen} onClose={() => setIsOutfitOpen(false)} />
    </>
  );
};
