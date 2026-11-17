import React from 'react';
import { cn } from '@/lib/cn';

type Tone = 'default' | 'success' | 'warning' | 'danger';

export type EyebrowProps = {
  children: React.ReactNode;
  /** Status indicator dot */
  tone?: Tone;
  /** Animate the dot with a pulse ring */
  pulse?: boolean;
  className?: string;
};

const dotColorMap: Record<Tone, string> = {
  default: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

const pulseRingMap: Record<Tone, string> = {
  default: 'ring-accent/30',
  success: 'ring-success/30',
  warning: 'ring-warning/30',
  danger: 'ring-danger/30',
};

/**
 * Tiny uppercase tracking label — used as section micro-headings.
 * Optionally rendered with a tonal status dot that can pulse.
 */
export const Eyebrow = React.forwardRef<HTMLSpanElement, EyebrowProps>(function Eyebrow(
  { children, tone, pulse = false, className },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5',
        'font-sans text-micro uppercase tracking-widest text-ink-500',
        className,
      )}
    >
      {tone !== undefined && (
        <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
          <span
            className={cn(
              'inline-block h-1.5 w-1.5 rounded-full',
              dotColorMap[tone],
            )}
          />
          {pulse && (
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-0 rounded-full ring-4 motion-safe:animate-ping',
                pulseRingMap[tone],
              )}
            />
          )}
        </span>
      )}
      {children}
    </span>
  );
});
