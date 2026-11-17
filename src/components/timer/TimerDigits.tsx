import React from 'react';
import { useTimerStore } from '@/features/timer/store';
import { formatClock } from '@/lib/time';

export type TimerDigitsProps = {
  className?: string;
};

export const timerDigitsRenderCount = { current: 0 };

export const TimerDigits: React.FC<TimerDigitsProps> = React.memo(function TimerDigits({
  className,
}) {
  timerDigitsRenderCount.current++;
  const remaining = useTimerStore(s => s.remaining);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeFormatted = formatClock(remaining);

  return (
    <div
      role="tabpanel"
      id="timer-tabpanel"
      aria-label="Timer countdown"
      className="w-full flex justify-center"
    >
      <div
        role="timer"
        aria-live="off"
        aria-label={`Timer: ${minutes} minutes ${seconds} seconds`}
        className={
          className ??
          'font-serif tabular-nums text-timer text-ink-900 leading-none select-none tracking-tight mb-8'
        }
      >
        {timeFormatted}
      </div>
    </div>
  );
});
