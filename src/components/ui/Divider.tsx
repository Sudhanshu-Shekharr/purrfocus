import React from 'react';
import { cn } from '@/lib/cn';

type DividerProps = {
  /** Visual label centered in the divider */
  label?: string;
  /** Axis: horizontal (default) or vertical */
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

/**
 * Semantic separator with optional centered label.
 * Uses role="separator" for accessibility.
 */
export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { label, orientation = 'horizontal', className },
  ref,
) {
  if (orientation === 'vertical') {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="vertical"
        className={cn('inline-block h-full w-px bg-glass-border', className)}
      />
    );
  }

  if (label) {
    return (
      <div
        ref={ref}
        role="separator"
        className={cn('flex items-center gap-3', className)}
      >
        <div className="h-px flex-1 bg-glass-border" />
        <span className="font-sans text-micro uppercase tracking-widest text-ink-500">
          {label}
        </span>
        <div className="h-px flex-1 bg-glass-border" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="separator"
      className={cn('h-px w-full bg-glass-border', className)}
    />
  );
});
