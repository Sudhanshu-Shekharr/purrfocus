import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export type TileProps = {
  label: string;
  icon: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  tabIndex?: number;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
};

/**
 * Selectable icon-over-label tile — for sound presets, scene pickers, etc.
 * Uses aria-pressed to communicate selection state to screen readers.
 * Includes gentle 120ms press scale (0.97).
 */
export const Tile = React.forwardRef<HTMLButtonElement, TileProps>(function Tile(
  {
    label,
    icon,
    selected = false,
    onSelect,
    disabled = false,
    className,
    id,
    tabIndex,
    onKeyDown,
  },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      id={id}
      type="button"
      role="button"
      aria-pressed={selected}
      disabled={disabled}
      tabIndex={tabIndex}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={onKeyDown}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'glass flex flex-col items-center justify-center gap-2 tile-press',
        'rounded-tile p-4 text-center min-h-[44px] min-w-[44px]',
        'font-sans text-small text-ink-700',
        'transition-all duration-base ease-soft',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected && 'ring-2 ring-accent text-accent glass-strong',
        !selected && !disabled && 'hover:glass-strong hover:text-ink-900',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span className="text-2xl [&>svg]:h-6 [&>svg]:w-6" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </motion.button>
  );
});
