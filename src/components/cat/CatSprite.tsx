import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTimerStore } from '@/features/timer/store';
import { useCatStore } from '@/features/cat/store';
import {
  useCatRuntimeStore,
  selectDisplayedPose,
} from '@/features/cat/controller';
import { getPoseDefinition, preloadNextLikelyPoses } from '@/data/poses';
import { useParallax } from '@/features/fx/useParallax';
import { getCatLines } from '@/features/cat/lines';
import { pickLine } from '@/data/dialogue';
import { CatAccessory } from './CatAccessory';

export type CatSpriteProps = {
  className?: string;
};

const HOLD_TO_PET_MS = 600;
const CLICK_LINE_COOLDOWN_MS = 8000;

export const CatSprite: React.FC<CatSpriteProps> = ({ className = '' }) => {
  const mode = useTimerStore(s => s.mode);
  const status = useTimerStore(s => s.status);
  const studyPoseVariant = useCatStore(s => s.studyPoseVariant);
  const name = useCatStore(s => s.name);
  const catId = useCatStore(s => s.catId);
  const outfitId = useCatStore(s => s.outfitId);

  const overlay = useCatRuntimeStore(s => s.overlay);
  const isSleeping = useCatRuntimeStore(s => s.isSleeping);
  const pet = useCatRuntimeStore(s => s.pet);

  const prefersReducedMotion = useReducedMotion();
  const parallax = useParallax();

  const [isHolding, setIsHolding] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickLineRef = useRef<number>(0);

  const displayedPose = selectDisplayedPose(
    overlay,
    isSleeping,
    mode,
    status,
    studyPoseVariant,
  );

  const poseDef = getPoseDefinition(displayedPose, catId);

  // Preload likely next poses during idle moments
  useEffect(() => {
    preloadNextLikelyPoses(displayedPose, catId);
  }, [displayedPose, catId]);

  const triggerClickReaction = (): void => {
    // 1. Click bounce keyframe (scale 1 -> 0.96 -> 1.02 -> 1, ~260ms)
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 260);

    // 2. Perform Pet action
    pet();

    // 3. Reaction line with strict 8s spam cooldown
    const now = Date.now();
    if (now - lastClickLineRef.current >= CLICK_LINE_COOLDOWN_MS) {
      lastClickLineRef.current = now;
      const clickLines = getCatLines('click');
      const pickedLine = pickLine(clickLines, now);
      if (pickedLine) {
        useCatRuntimeStore.getState().setBubbleLine(pickedLine);
      }
    }
  };

  const startHold = (): void => {
    setIsHolding(true);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      pet();
      setIsHolding(false);
    }, HOLD_TO_PET_MS);
  };

  const cancelHold = (): void => {
    setIsHolding(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleClick = (): void => {
    triggerClickReaction();
  };

  return (
    <div
      id="cat-sprite"
      className={`relative flex items-center justify-center select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-card ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`Pet ${name}`}
      title={`Click or hold to pet ${name}`}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerClickReaction();
        }
      }}
    >
      {/* Hold-to-pet subtle pulse ring */}
      {isHolding && !prefersReducedMotion && (
        <span
          className="absolute inset-0 rounded-full border-2 border-accent/60 animate-ping pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Breathing scale container and click bounce */}
      <motion.div
        animate={
          isBouncing && !prefersReducedMotion
            ? { scale: [1, 0.96, 1.02, 1] }
            : prefersReducedMotion
              ? { scale: 1 }
              : { scale: [1, 1.015, 1] }
        }
        transition={
          isBouncing && !prefersReducedMotion
            ? { duration: 0.26, ease: 'easeOut' }
            : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
        whileTap={{ scale: 0.96 }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={displayedPose}
            style={
              prefersReducedMotion
                ? undefined
                : {
                    x: parallax.x,
                    y: parallax.y,
                  }
            }
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative w-full h-full flex items-center justify-center max-h-[170px]"
          >
            <img
              src={poseDef.src}
              alt={poseDef.alt}
              width={180}
              height={180}
              loading="eager"
              decoding="async"
              className="w-full h-full object-contain pointer-events-none drop-shadow-sm max-h-[170px]"
              draggable={false}
            />
            <CatAccessory
              outfitId={outfitId}
              poseId={displayedPose}
              catId={catId}
              className="absolute inset-0 w-full h-full max-h-[170px]"
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
