import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCatRuntimeStore } from '@/features/cat/controller';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type ThoughtBubbleProps = {
  className?: string;
};

export const ThoughtBubble: React.FC<ThoughtBubbleProps> = ({ className = '' }) => {
  const currentLine = useCatRuntimeStore(s => s.currentLine);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`relative flex flex-col items-center justify-center min-h-[44px] max-w-[260px] text-center select-none ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        {currentLine ? (
          <motion.div
            key={currentLine}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col items-center"
          >
            {/* Rounded Cream Bubble */}
            <div className="bg-[#FFFDF9]/95 dark:bg-[#181615]/85 border border-[#E8DEC8]/80 dark:border-white/15 shadow-sm px-4 py-2 rounded-2xl max-w-[240px]">
              <p className="font-sans text-xs md:text-small text-ink-900 dark:text-surface font-medium leading-relaxed">
                {currentLine}
              </p>
            </div>

            {/* Two trailing speech dots pointing to the cat */}
            <div className="flex flex-col items-center gap-1 mt-1" aria-hidden="true">
              <span className="w-2 h-2 rounded-full bg-[#FFFDF9]/95 dark:bg-[#181615]/85 border border-[#E8DEC8]/80 dark:border-white/15 shadow-xs" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFFDF9]/95 dark:bg-[#181615]/85 border border-[#E8DEC8]/80 dark:border-white/15 shadow-xs ml-1" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
