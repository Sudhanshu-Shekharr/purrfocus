import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useCatRuntimeStore } from '@/features/cat/controller';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const HEART_CONFIGS = [
  { id: 1, x: -35, delay: 0, size: 18, color: '#FF6B81' },
  { id: 2, x: 25, delay: 0.15, size: 22, color: '#FF758F' },
  { id: 3, x: -10, delay: 0.3, size: 16, color: '#FF8FA3' },
  { id: 4, x: 40, delay: 0.45, size: 20, color: '#FF4D6D' },
  { id: 5, x: -45, delay: 0.6, size: 14, color: '#FFB3C1' },
];

export const Hearts: React.FC = () => {
  const overlay = useCatRuntimeStore(s => s.overlay);
  const prefersReducedMotion = useReducedMotion();

  if (overlay?.type !== 'pet_happy') {
    return null;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-10"
      aria-hidden="true"
    >
      {HEART_CONFIGS.map(h => (
        <motion.div
          key={h.id}
          initial={
            prefersReducedMotion
              ? { opacity: 0, scale: 0.8 }
              : { opacity: 0, y: 10, x: h.x, scale: 0.5 }
          }
          animate={
            prefersReducedMotion
              ? { opacity: [0, 1, 1, 0], scale: 1 }
              : {
                  opacity: [0, 1, 1, 0],
                  y: -65,
                  x: h.x + (h.id % 2 === 0 ? 8 : -8),
                  scale: [0.5, 1.15, 1, 0.7],
                }
          }
          transition={{
            duration: 1.3,
            delay: h.delay,
            ease: 'easeOut',
          }}
          className="absolute"
        >
          <Heart
            style={{ width: h.size, height: h.size, color: h.color, fill: h.color }}
            className="drop-shadow-xs"
          />
        </motion.div>
      ))}
    </div>
  );
};
