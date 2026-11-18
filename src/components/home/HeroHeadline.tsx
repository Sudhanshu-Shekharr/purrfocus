import React from 'react';
import { motion } from 'framer-motion';
import { VisuallyHidden } from '@/components/ui';
import {
  HERO_FIRST_LINE_VARIANTS,
  HERO_FLIP_DEGREES,
  HERO_STATIC_HEADING,
  HERO_TRANSITION_DURATION_S,
} from '@/data/hero';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useHeroRotation } from './heroRotation';

const SOFT_EASE = [0.22, 1, 0.36, 1] as const;

export const HeroHeadline: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const { activeIndex, prevIndex } = useHeroRotation(prefersReducedMotion);

  return (
    <h1 className="font-serif text-hero text-surface tracking-tight leading-[1.1] mb-2 drop-shadow-xs">
      {/* Static full heading for assistive tech so the h1 accessible name never shifts */}
      <VisuallyHidden>{HERO_STATIC_HEADING}</VisuallyHidden>

      {/* Line 1: All six variants share one grid cell (1 / 1) to reserve width and prevent reflow */}
      <span
        data-hero-line="1"
        aria-hidden="true"
        className="grid [perspective:600px]"
      >
        {HERO_FIRST_LINE_VARIANTS.map((variant, idx) => {
          const isActive = idx === activeIndex;
          const isExiting = !prefersReducedMotion && idx === prevIndex && !isActive;

          const animateTarget = prefersReducedMotion
            ? { opacity: isActive ? 1 : 0, rotateX: 0 }
            : isActive
              ? { opacity: 1, rotateX: 0 }
              : isExiting
                ? { opacity: 0, rotateX: -HERO_FLIP_DEGREES }
                : { opacity: 0, rotateX: HERO_FLIP_DEGREES };

          const transitionDuration =
            prefersReducedMotion || (!isActive && !isExiting) ? 0 : HERO_TRANSITION_DURATION_S;

          return (
            <motion.span
              key={variant}
              data-hero-variant={idx}
              data-active={isActive ? 'true' : 'false'}
              initial={false}
              animate={animateTarget}
              transition={{ duration: transitionDuration, ease: SOFT_EASE }}
              style={{
                gridArea: '1 / 1',
                transformOrigin: '50% 60%',
                pointerEvents: isActive ? 'auto' : 'none',
              }}
              className="block"
            >
              {variant}
            </motion.span>
          );
        })}
      </span>

      {/* Line 2: Fixed closing line preserving existing italic accent styling */}
      <span data-hero-line="2" aria-hidden="true" className="block">
        Find your <span className="italic text-accent-focus">focus.</span>
      </span>
    </h1>
  );
};
