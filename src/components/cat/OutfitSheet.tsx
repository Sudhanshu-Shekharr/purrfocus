import React, { useState, useEffect } from 'react';
import { Check, Heart } from 'lucide-react';
import { Modal, PillButton } from '@/components/ui';
import { useIsMobile } from '@/hooks';
import { useCatStore } from '@/features/cat/store';
import { CATS, getCatDefinition } from '@/data/cats';
import { OUTFITS } from '@/data/outfits';
import {
  getBondLevelLabel,
  getNextLevelInfo,
} from '@/features/cat/bond';
import { getPoseDefinition } from '@/data/poses';
import { CatAccessory } from './CatAccessory';

export type OutfitSheetProps = {
  open: boolean;
  onClose: () => void;
};

export const OutfitSheet: React.FC<OutfitSheetProps> = ({ open, onClose }) => {
  const storeCatId = useCatStore(s => s.catId);
  const storeOutfitId = useCatStore(s => s.outfitId);
  const bond = useCatStore(s => s.bond);
  const setCatId = useCatStore(s => s.setCatId);
  const setOutfitId = useCatStore(s => s.setOutfitId);

  const [selectedCatId, setSelectedCatId] = useState(storeCatId);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(storeOutfitId);

  useEffect(() => {
    if (open) {
      setSelectedCatId(storeCatId);
      setSelectedOutfitId(storeOutfitId);
    }
  }, [open, storeCatId, storeOutfitId]);

  const levelInfo = getNextLevelInfo(bond);
  const currentLevelLabel = getBondLevelLabel(levelInfo.currentLevel);

  const handleSave = (): void => {
    setCatId(selectedCatId);
    setOutfitId(selectedOutfitId);
    onClose();
  };

  const previewPose = getPoseDefinition('idle_happy', selectedCatId);
  const selectedCat = getCatDefinition(selectedCatId);
  const isMobile = useIsMobile();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Customize Companion"
      variant={isMobile ? 'bottom' : 'center'}
      className={isMobile ? 'w-full' : 'max-w-md w-full'}
      footer={
        <div className="flex items-center justify-end gap-2">
          <PillButton variant="glass" size="sm" type="button" onClick={onClose}>
            Cancel
          </PillButton>
          <PillButton variant="primary" size="sm" type="button" onClick={handleSave}>
            Save changes
          </PillButton>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pr-1">
        {/* 1. Companion Live Preview & Bond Status */}
        <div className="glass rounded-card p-4 flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-28 h-28 my-1 flex items-center justify-center relative">
            <img
              src={previewPose.src}
              alt={`${selectedCat.name} Preview`}
              className="w-full h-full object-contain drop-shadow-sm"
            />
            <CatAccessory
              outfitId={selectedOutfitId}
              poseId="idle_happy"
              catId={selectedCatId}
              className="absolute inset-0 w-full h-full"
            />
          </div>

          <div className="flex flex-col items-center mt-1">
            <span className="font-serif text-lg font-medium text-ink-900">
              {selectedCat.name}
            </span>
            <span className="font-sans text-xs text-ink-500 font-medium">
              {selectedCat.breed}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <Heart className="h-4 w-4 text-accent fill-accent" />
            <span className="font-serif text-small font-medium text-ink-900">
              {currentLevelLabel}
            </span>
            <span className="font-sans text-xs text-ink-500">({bond} bond)</span>
          </div>

          {/* Progress bar to next bond level */}
          <div className="w-full max-w-[200px] mt-2">
            <div className="w-full bg-ink-500/15 h-2 rounded-full overflow-hidden">
              <div
                className="bg-accent h-full rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
            <p className="font-sans text-xs text-ink-500 mt-1">
              {levelInfo.nextLevel
                ? `${levelInfo.pointsToNext} pts to ${getBondLevelLabel(levelInfo.nextLevel)}`
                : 'Maximum bond reached!'}
            </p>
          </div>
        </div>

        {/* 2. Cat Breed / Variant Selection */}
        <div>
          <h3 className="font-serif text-body font-medium text-ink-900 mb-2.5">
            Choose Character
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {CATS.map(cat => {
              const isSelected = selectedCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`flex flex-col items-start p-3 rounded-card border text-left transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-sm ring-1 ring-accent'
                      : 'border-glass-border hover:bg-glass/80 text-ink-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-serif font-medium text-ink-900">{cat.name}</span>
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs shrink-0"
                      style={{ backgroundColor: cat.previewColor }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="font-sans text-xs text-ink-500">{cat.breed}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Outfits & Accessories */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-serif text-body font-medium text-ink-900">
              Outfits & Accessories
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {OUTFITS.map(outfit => {
              const isSelected = (selectedOutfitId ?? 'none') === outfit.id;

              return (
                <button
                  key={outfit.id}
                  type="button"
                  onClick={() => setSelectedOutfitId(outfit.id === 'none' ? null : outfit.id)}
                  className={`flex flex-col items-start p-3 rounded-card border text-left w-full transition-all relative ${
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-sm ring-1 ring-accent'
                      : 'border-glass-border hover:bg-glass/80 text-ink-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xl" role="img" aria-label={outfit.name}>
                      {outfit.previewEmoji}
                    </span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-accent" />
                    )}
                  </div>
                  <span className="font-sans text-small font-medium text-ink-900 truncate w-full">
                    {outfit.name}
                  </span>
                  <span className="font-sans text-xs text-ink-500 line-clamp-1">
                    {outfit.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
