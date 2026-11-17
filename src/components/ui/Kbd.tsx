import React from 'react';
import { cn } from '@/lib/cn';

type KbdProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Keyboard key label — styled as a physical key chip.
 * Useful in tooltips and help text.
 */
export const Kbd = React.forwardRef<HTMLElement, KbdProps>(function Kbd(
  { children, className },
  ref,
) {
  return (
    <kbd
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center px-1.5 py-0.5',
        'rounded border border-glass-border bg-glass',
        'font-sans text-micro uppercase tracking-widest text-ink-700',
        'shadow-card',
        className,
      )}
    >
      {children}
    </kbd>
  );
});
