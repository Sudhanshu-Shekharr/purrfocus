import React from 'react';
import { motion } from 'framer-motion';
import { VisuallyHidden } from '@/components/ui';
import { useTimerStore } from '@/features/timer/store';
import { getSessionCaption } from '@/data/dialogue';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { transitionFast } from '@/lib/motion';

export type SessionDotsProps = {
  className?: string;
};

export const sessionDotsRenderCount = { current: 0 };

export const SessionDots: React.FC<SessionDotsProps> = React.memo(function SessionDots({
  className,
}) {
  sessionDotsRenderCount.current++;
  const cycles = useTimerStore(s => s.cyclesBeforeLongBreak);
  const completed = useTimerStore(s => s.completedFocusSessions);
  const shouldReduceMotion = useReducedMotion();

  const caption = getSessionCaption(completed);
  const dots = Array.from({ length: cycles }, (_, i) => i < completed);

  return (
    <div className={className ?? 'flex items-center gap-2 my-1'}>
      <VisuallyHidden>
        {`${completed} of ${cycles} focus sessions completed.`}
      </VisuallyHidden>

      <div className="flex items-center gap-2" aria-hidden="true">
        {dots.map((filled, idx) => (
          <span
            key={idx}
            className="relative flex items-center justify-center h-3.5 w-3.5 rounded-full border-2 border-glass-border"
          >
            {filled && (
              <motion.span
                layout
                initial={shouldReduceMotion ? { scale: 1 } : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={shouldReduceMotion ? { duration: 0 } : transitionFast}
                className="h-2 w-2 rounded-full bg-accent"
              />
            )}
          </span>
        ))}
      </div>

      <span className="font-sans text-small text-ink-700 font-medium ml-1.5">
        {caption}
      </span>
    </div>
  );
});
