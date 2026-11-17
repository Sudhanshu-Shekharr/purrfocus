import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'glass' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export type PillButtonProps = {
  variant?: Variant;
  size?: Size;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  className?: string;
  /** Forwarded to the underlying button */
  id?: string;
  'aria-label'?: string;
  'aria-pressed'?: boolean | 'true' | 'false' | 'mixed';
  'aria-expanded'?: boolean | 'true' | 'false';
  'aria-controls'?: string;
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
};

const variantMap: Record<Variant, string> = {
  primary:
    'bg-ink-900 text-surface border border-ink-900 hover:bg-ink-700 hover:border-ink-700',
  glass:
    'glass text-ink-900 hover:glass-strong',
  ghost:
    'bg-transparent text-ink-700 border border-transparent hover:bg-glass hover:text-ink-900',
};

const sizeMap: Record<Size, string> = {
  sm: 'h-8 px-3 text-small gap-1.5',
  md: 'h-10 px-5 text-body gap-2',
  lg: 'h-12 px-7 text-body gap-2.5',
};

/**
 * Pill-shaped button with three visual variants.
 * Includes a gentle 120ms press scale (0.97). No hover lift on buttons.
 * Icon slots accept any ReactNode (typically Lucide icons).
 */
export const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  function PillButton(
    {
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      loading = false,
      fullWidth = false,
      disabled = false,
      onClick,
      type = 'button',
      children,
      className,
      id,
      'aria-label': ariaLabel,
      'aria-pressed': ariaPressed,
      'aria-expanded': ariaExpanded,
      'aria-controls': ariaControls,
      'aria-haspopup': ariaHaspopup,
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        id={id}
        type={type}
        disabled={isDisabled}
        onClick={isDisabled ? undefined : onClick}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-haspopup={ariaHaspopup}
        aria-busy={loading}
        whileTap={isDisabled ? {} : { scale: 0.97 }}
        transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'inline-flex items-center justify-center rounded-pill font-sans font-medium btn-press',
          'transition-colors duration-base ease-soft',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          variantMap[variant],
          sizeMap[size],
          fullWidth && 'w-full',
          isDisabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          leftIcon && <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && (
          <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{rightIcon}</span>
        )}
      </motion.button>
    );
  },
);
