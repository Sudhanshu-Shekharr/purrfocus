import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { GlassCard, Eyebrow } from '@/components/ui';
import { Sparkles, MessageCircle } from 'lucide-react';
import { COLLECTIBLES, type CollectibleId } from '@/data/collectibles';
import { computeUnlocked } from '@/features/rewards/unlocks';
import { currentStreak } from '@/features/stats/selectors';
import { useStatsStore } from '@/features/stats/store';
import { useCatRuntimeStore } from '@/features/cat/controller';

// Simple cozy SVG renderings for each collectible
const CollectibleGraphic: React.FC<{ id: CollectibleId; unlocked: boolean }> = ({
  id,
  unlocked,
}) => {
  switch (id) {
    case 'tea-mug':
      return (
        <svg viewBox="0 0 48 48" className="w-12 h-12" aria-hidden="true">
          {/* Steam wisps when unlocked */}
          {unlocked && (
            <path
              d="M18 10C17 7 21 5 20 2 M26 10C25 7 29 5 28 2"
              stroke="#D4A373"
              strokeWidth="2"
              strokeLinecap="round"
              className="motion-safe:animate-pulse opacity-80"
            />
          )}
          {/* Mug body */}
          <path
            d="M12 14H32V32C32 37 28 40 22 40C16 40 12 37 12 32V14Z"
            fill={unlocked ? '#E76F51' : 'currentColor'}
            stroke={unlocked ? '#D46043' : 'currentColor'}
            strokeWidth="2"
          />
          {/* Handle */}
          <path
            d="M32 18H36C38 18 40 20 40 23V27C40 30 38 32 36 32H32"
            fill="none"
            stroke={unlocked ? '#D46043' : 'currentColor'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'plant':
      return (
        <svg viewBox="0 0 48 48" className="w-12 h-12" aria-hidden="true">
          {/* Leaves */}
          <path
            d="M24 18C18 14 14 18 16 26C18 22 22 20 24 18Z"
            fill={unlocked ? '#5E8B7E' : 'currentColor'}
          />
          <path
            d="M24 16C30 12 34 16 32 24C30 20 26 18 24 16Z"
            fill={unlocked ? '#79A89B' : 'currentColor'}
          />
          <path
            d="M24 10C24 4 28 4 28 10C26 8 25 8 24 10Z"
            fill={unlocked ? '#5E8B7E' : 'currentColor'}
          />
          {/* Trailing vine */}
          <path
            d="M18 26C16 30 12 32 10 38"
            stroke={unlocked ? '#4E7368' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Pot */}
          <path
            d="M17 26H31L29 42H19L17 26Z"
            fill={unlocked ? '#D4A373' : 'currentColor'}
            stroke={unlocked ? '#B88655' : 'currentColor'}
            strokeWidth="2"
          />
        </svg>
      );
    case 'lamp':
      return (
        <svg viewBox="0 0 48 48" className="w-12 h-12" aria-hidden="true">
          {/* Warm glow halo when unlocked */}
          {unlocked && (
            <circle cx="24" cy="18" r="14" fill="#F4A261" fillOpacity="0.25" className="motion-safe:animate-pulse" />
          )}
          {/* Lamp shade */}
          <path
            d="M14 20L19 10H29L34 20H14Z"
            fill={unlocked ? '#F4A261' : 'currentColor'}
            stroke={unlocked ? '#E76F51' : 'currentColor'}
            strokeWidth="2"
          />
          {/* Stem & base */}
          <line
            x1="24"
            y1="20"
            x2="24"
            y2="40"
            stroke={unlocked ? '#8D6B4F' : 'currentColor'}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M16 40H32"
            stroke={unlocked ? '#8D6B4F' : 'currentColor'}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'photo-frame':
      return (
        <svg viewBox="0 0 48 48" className="w-12 h-12" aria-hidden="true">
          {/* Frame */}
          <rect
            x="12"
            y="10"
            width="24"
            height="30"
            rx="3"
            fill={unlocked ? '#E9D8A6' : 'currentColor'}
            stroke={unlocked ? '#B08968' : 'currentColor'}
            strokeWidth="3"
          />
          {/* Inner picture: gentle sun and hills */}
          {unlocked && (
            <>
              <circle cx="20" cy="19" r="3" fill="#EE9B00" />
              <path d="M15 34L20 26L26 34H15Z" fill="#5E8B7E" />
              <path d="M22 34L27 28L33 34H22Z" fill="#94D2BD" />
            </>
          )}
          {/* Frame stand */}
          <line
            x1="24"
            y1="34"
            x2="28"
            y2="42"
            stroke={unlocked ? '#B08968' : 'currentColor'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'bookmark':
      return (
        <svg viewBox="0 0 48 48" className="w-12 h-12" aria-hidden="true">
          {/* Bookmark body */}
          <path
            d="M16 8H32V42L24 36L16 42V8Z"
            fill={unlocked ? '#FAEDCD' : 'currentColor'}
            stroke={unlocked ? '#CCD5AE' : 'currentColor'}
            strokeWidth="2"
          />
          {/* Pressed blossom */}
          {unlocked && (
            <path
              d="M24 16C23 13 25 13 24 16C21 15 21 17 24 16C23 19 25 19 24 16C27 17 27 15 24 16Z"
              fill="#E07A5F"
              stroke="#D46043"
              strokeWidth="1"
            />
          )}
          {/* Ribbon tie */}
          <path
            d="M24 8V3C23 1 25 1 24 3"
            stroke={unlocked ? '#D4A373' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
  }
};

export const DeskIllustration: React.FC = () => {
  const logs = useStatsStore(state => state.logs);
  const streak = currentStreak(logs);
  const unlockedIds = computeUnlocked(logs, streak);
  const shouldReduceMotion = useReducedMotion();

  const currentLine = useCatRuntimeStore(state => state.currentLine);
  const deskTap = useCatRuntimeStore(state => state.deskTap);

  const [tappedId, setTappedId] = useState<CollectibleId | null>(null);

  const handleTap = (id: CollectibleId) => {
    if (!unlockedIds.includes(id)) return;

    setTappedId(id);
    deskTap();
    setTimeout(() => {
      setTappedId(null);
    }, 600);
  };

  return (
    <GlassCard className="p-4 sm:p-6 w-full flex flex-col gap-5" role="region" aria-label="Desk illustration with study collectibles">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <Eyebrow className="text-ink-600">SANCTUARY</Eyebrow>
          <h2 className="font-serif text-lg text-ink-900 mt-0.5 font-medium">Your Study Desk</h2>
        </div>
        <div className="flex items-center gap-1.5 glass px-3 py-1 rounded-pill text-micro font-medium text-ink-700 border border-glass-border">
          <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          <span>{unlockedIds.length} of {COLLECTIBLES.length} unlocked</span>
        </div>
      </div>

      {/* Cozy Desk Scene Container */}
      <div className="relative w-full rounded-card overflow-hidden bg-gradient-to-b from-surface/20 to-surface/60 border border-glass-border/60 p-4 sm:p-6 flex flex-col items-center">
        {/* Cat thought bubble reflection over desk */}
        <div className="w-full flex justify-center mb-4 min-h-[38px]">
          <div
            className="glass px-4 py-1.5 rounded-pill border border-glass-border shadow-xs flex items-center gap-2 max-w-md text-center transition-all duration-300"
            role="status"
            aria-live="polite"
          >
            <MessageCircle className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden="true" />
            <span className="font-sans text-small text-ink-800 italic truncate">
              &ldquo;{currentLine}&rdquo;
            </span>
          </div>
        </div>

        {/* The Desk Surface Drawing (Hand-rolled SVG with Collectible Slots) */}
        <div className="w-full max-w-[700px] relative">
          <svg
            viewBox="0 0 700 240"
            className="w-full h-auto select-none"
            aria-hidden="true"
          >
            {/* Wooden Desk Top Mat */}
            <path
              d="M40 70L660 70L690 190L10 190Z"
              fill="#D4B996"
              fillOpacity="0.25"
              stroke="#B08968"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Desk Edge & Apron */}
            <rect x="10" y="190" width="680" height="24" rx="2" fill="#B08968" fillOpacity="0.35" stroke="#9C6644" strokeWidth="2" />
            {/* Desk Legs */}
            <rect x="40" y="214" width="18" height="26" fill="#8D6B4F" fillOpacity="0.4" />
            <rect x="642" y="214" width="18" height="26" fill="#8D6B4F" fillOpacity="0.4" />

            {/* Cozy Desk Mat (middle runner) */}
            <rect x="180" y="86" width="340" height="96" rx="6" fill="#5E8B7E" fillOpacity="0.15" stroke="#5E8B7E" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>

          {/* Collectible Items Slot Overlay */}
          <div className="absolute inset-0 flex items-center justify-around px-4 sm:px-12 pt-6">
            {COLLECTIBLES.map(item => {
              const unlocked = unlockedIds.includes(item.id);
              const isBouncing = tappedId === item.id;

              return (
                <div key={item.id} className="flex flex-col items-center">
                  {unlocked ? (
                    <motion.button
                      type="button"
                      onClick={() => handleTap(item.id)}
                      animate={
                        isBouncing && !shouldReduceMotion
                          ? { scale: [1, 0.85, 1.15, 0.95, 1], rotate: [0, -4, 4, -2, 0] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.4 }}
                      aria-label={`${item.name} (Unlocked). Tap to interact.`}
                      className="p-1 rounded-card transition-all hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent cursor-pointer group"
                    >
                      <CollectibleGraphic id={item.id} unlocked={true} />
                    </motion.button>
                  ) : (
                    <div
                      role="img"
                      aria-label={`${item.name} (Locked). ${item.unlockRequirement}`}
                      className="p-1 rounded-card text-ink-900 opacity-25 filter grayscale select-none"
                    >
                      <CollectibleGraphic id={item.id} unlocked={false} />
                    </div>
                  )}

                  {/* Title & subtle hint */}
                  <div className="text-center mt-1 max-w-[100px]">
                    <span className="block text-micro font-medium text-ink-900 leading-tight truncate">
                      {item.name}
                    </span>
                    <span className="block text-[10px] text-ink-500 leading-tight mt-0.5">
                      {unlocked ? 'Unlocked' : item.unlockRequirement}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
