import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { transitionBase } from '@/lib/motion';

type Size = 'sm' | 'md';

export type IconButtonProps = {
  /** Required — used as aria-label. Describe the action, not the icon. */
  label: string;
  size?: Size;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  className?: string;
  id?: string;
};

const sizeMap: Record<Size, string> = {
  sm: 'h-8 w-8 [&>svg]:h-4 [&>svg]:w-4',
  md: 'h-10 w-10 [&>svg]:h-5 [&>svg]:w-5',
};

/**
 * Round glass icon button.
 * `label` is required and used as the accessible name via `aria-label`.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, size = 'md', onClick, disabled = false, type = 'button', children, className, id }, ref) {
    return (
      <motion.button
        ref={ref}
        id={id}
        type={type}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        aria-label={label}
        whileTap={disabled ? {} : { scale: 0.95 }}
        transition={transitionBase}
        className={cn(
          'glass inline-flex shrink-0 items-center justify-center rounded-full',
          'text-ink-700 transition-colors duration-base ease-soft',
          'hover:text-ink-900 hover:glass-strong',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          sizeMap[size],
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        {children}
      </motion.button>
    );
  },
);
