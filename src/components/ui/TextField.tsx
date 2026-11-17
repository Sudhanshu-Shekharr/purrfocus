import React, { useId } from 'react';
import { cn } from '@/lib/cn';

export type TextFieldProps = {
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  /** Error message — replaces helperText and shows error styling */
  error?: string;
  /** Slot for a trailing action element (e.g. add button) */
  trailingAction?: React.ReactNode;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  type?: React.HTMLInputTypeAttribute;
  className?: string;
};

/**
 * Glass-styled text input with label, helper/error text, and trailing action slot.
 */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    value,
    defaultValue,
    onChange,
    placeholder,
    helperText,
    error,
    trailingAction,
    id: externalId,
    required = false,
    disabled = false,
    type = 'text',
    className,
  },
  ref,
) {
  const innerId = useId();
  const id = externalId ?? innerId;
  const helpId = `${id}-help`;
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className={cn(
          'font-sans text-small font-medium text-ink-700',
          disabled && 'opacity-50',
        )}
      >
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="relative flex items-center">
        <input
          ref={ref}
          id={id}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={helperText || error ? helpId : undefined}
          className={cn(
            'glass w-full rounded-tile px-4 py-2.5 font-sans text-body text-ink-900',
            'placeholder:text-ink-500 outline-none',
            'transition-shadow duration-base ease-soft',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0',
            hasError && 'ring-2 ring-danger',
            trailingAction && 'pr-10',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        />
        {trailingAction && (
          <div className="absolute right-1 flex items-center">{trailingAction}</div>
        )}
      </div>

      {(error || helperText) && (
        <span
          id={helpId}
          className={cn(
            'font-sans text-small',
            hasError ? 'text-danger' : 'text-ink-500',
          )}
        >
          {error ?? helperText}
        </span>
      )}
    </div>
  );
});
