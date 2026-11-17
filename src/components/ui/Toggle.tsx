import React, { useId } from 'react';
import { cn } from '@/lib/cn';

export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Hide label visually (still present for screen readers) */
  hideLabel?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/**
 * Accessible switch toggle (role="switch").
 * Always requires a `label` for screen reader users.
 */
export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { checked, onChange, label, hideLabel = false, disabled = false, id: externalId, className },
  ref,
) {
  const innerId = useId();
  const id = externalId ?? innerId;
  const labelId = `${id}-label`;

  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <span
        id={labelId}
        className={cn(
          'font-sans text-body text-ink-700 select-none',
          hideLabel && 'sr-only',
          disabled && 'opacity-50',
        )}
      >
        {label}
      </span>

      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill',
          'border-2 border-transparent outline-none',
          'transition-colors duration-base ease-soft',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          checked ? 'bg-accent' : 'bg-glass-border',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-card',
            'transition-transform duration-base ease-soft',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
});
