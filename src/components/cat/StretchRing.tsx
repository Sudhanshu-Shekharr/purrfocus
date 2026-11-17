import React from 'react';
import { motion } from 'framer-motion';
import { useCatRuntimeStore } from '@/features/cat/controller';

export const StretchRing: React.FC = () => {
  const stretchRemaining = useCatRuntimeStore(s => s.stretchRemaining);

  if (stretchRemaining === null) {
    return null;
  }

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  // Progress from 1 (10s left) down to 0 (0s left)
  const progress = Math.max(0, Math.min(1, stretchRemaining / 10));
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute top-2 right-2 flex flex-col items-center justify-center z-20 bg-white/85 dark:bg-black/75 backdrop-blur-sm p-1.5 rounded-full shadow-sm border border-glass-border"
      aria-label={`Stretch together: ${stretchRemaining} seconds remaining`}
    >
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
          {/* Background circle */}
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-ink-500/20"
          />
          {/* Progress circle */}
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-accent transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <span className="absolute font-sans font-semibold text-xs text-ink-900">
          {stretchRemaining}s
        </span>
      </div>
    </motion.div>
  );
};
