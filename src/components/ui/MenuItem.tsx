import React from 'react';
import { cn } from '@/lib/cn';

export type MenuItemProps = {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

/**
 * A single menu item inside a Popover menu.
 * Renders as role="menuitem". Arrow-key navigation is handled by the parent Popover.
 */
export const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(function MenuItem(
  { children, onClick, icon, disabled = false, className },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5',
        'font-sans text-body text-ink-700 text-left',
        'transition-colors duration-fast ease-soft',
        'hover:bg-glass hover:text-ink-900',
        'focus:outline-none focus:bg-glass focus:text-ink-900',
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
        disabled && 'cursor-not-allowed opacity-40',
        className,
      )}
    >
      {icon && (
        <span className="shrink-0 text-ink-500 [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
});
