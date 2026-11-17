import { useEffect } from 'react';
import { useSpring } from 'framer-motion';
import { usePrefsStore } from '@/features/prefs/store';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { computeParallaxOffset } from './parallax';

export function useParallax(cardRef?: React.RefObject<HTMLElement | null>) {
  const focusMode = usePrefsStore(s => s.focusMode);
  const reducedMotion = useReducedMotion();

  // Smooth spring physics for pointer parallax
  const x = useSpring(0, { stiffness: 180, damping: 24, mass: 0.5 });
  const y = useSpring(0, { stiffness: 180, damping: 24, mass: 0.5 });

  useEffect(() => {
    if (reducedMotion) {
      x.set(0);
      y.set(0);
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const card = cardRef?.current || document.getElementById('cat-companion-card');
      const rect = card?.getBoundingClientRect();
      if (!rect) return;

      const offset = computeParallaxOffset(
        { x: e.clientX, y: e.clientY },
        rect,
        { focusMode, reducedMotion },
      );

      x.set(offset.x);
      y.set(offset.y);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      x.set(0);
      y.set(0);
    };
  }, [focusMode, reducedMotion, cardRef, x, y]);

  return { x, y };
}
