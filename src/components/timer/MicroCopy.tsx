import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimerStore } from '@/features/timer/store';
import { getMicroCopy } from '@/data/dialogue';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { transitionFast } from '@/lib/motion';

export type MicroCopyProps = {
  className?: string;
};

export const microCopyRenderCount = { current: 0 };

export const MicroCopy: React.FC<MicroCopyProps> = React.memo(function MicroCopy({
  className,
}) {
  microCopyRenderCount.current++;
  const mode = useTimerStore(s => s.mode);
  const status = useTimerStore(s => s.status);
  const sessionId = useTimerStore(s => s.sessionId);
  const shouldReduceMotion = useReducedMotion();

  const seed = sessionId ?? `${mode}:${status}`;
  const line = getMicroCopy(mode, status, seed);

  return (
    <div
      className={
        className ??
        'font-sans text-small text-ink-700 font-medium min-h-[1.5rem] flex items-center justify-center'
      }
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={`${mode}-${status}-${line}`}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -2 }}
          transition={shouldReduceMotion ? { duration: 0 } : transitionFast}
        >
          {line}
        </motion.p>
      </AnimatePresence>
    </div>
  );
});
