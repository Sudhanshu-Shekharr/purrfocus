import React, { useId, useRef, useCallback } from 'react';
import { cn } from '@/lib/cn';

export type SliderProps = {
  /** Required accessible label */
  'aria-label': string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Show a percentage/value readout next to the slider */
  showValue?: boolean;
  /** Format the displayed value string */
  formatValue?: (value: number, min: number, max: number) => string;
  disabled?: boolean;
  /** Human-readable string for assistive technology (e.g. "60%") */
  'aria-valuetext'?: string;
  id?: string;
  className?: string;
};

function defaultFormatValue(value: number, min: number, max: number): string {
  const pct = Math.round(((value - min) / (max - min)) * 100);
  return `${pct}%`;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function snapToStep(val: number, min: number, step: number): number {
  return Math.round((val - min) / step) * step + min;
}

/**
 * Accessible slider with thin track, filled portion, and round accent thumb.
 *
 * Keyboard: Arrow keys (±step), PageUp/Down (±10% of range), Home/End (min/max).
 * Pointer: drag with pointer capture on the track.
 * ARIA: role="slider", aria-valuenow/min/max, aria-label required.
 */
export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(function Slider(
  {
    'aria-label': ariaLabel,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    showValue = false,
    formatValue = defaultFormatValue,
    disabled = false,
    'aria-valuetext': ariaValueText,
    id,
    className,
  },
  ref,
) {
  const innerId = useId();
  const sliderId = id ?? innerId;
  const trackRef = useRef<HTMLDivElement>(null);
  const fillPct = clamp(((value - min) / (max - min)) * 100, 0, 100);

  const updateFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const raw = min + ratio * (max - min);
      onChange(clamp(snapToStep(raw, min, step), min, max));
    },
    [min, max, step, onChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateFromPointer(e.clientX);
    },
    [disabled, updateFromPointer],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || e.buttons === 0) return;
      updateFromPointer(e.clientX);
    },
    [disabled, updateFromPointer],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const range = max - min;
      let next = value;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          next = clamp(snapToStep(value + step, min, step), min, max);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          next = clamp(snapToStep(value - step, min, step), min, max);
          break;
        case 'PageUp':
          e.preventDefault();
          next = clamp(snapToStep(value + range * 0.1, min, step), min, max);
          break;
        case 'PageDown':
          e.preventDefault();
          next = clamp(snapToStep(value - range * 0.1, min, step), min, max);
          break;
        case 'Home':
          e.preventDefault();
          next = min;
          break;
        case 'End':
          e.preventDefault();
          next = max;
          break;
        default:
          return;
      }

      onChange(next);
    },
    [disabled, min, max, step, value, onChange],
  );

  return (
    <div ref={ref} className={cn('flex items-center gap-3', className)}>
      {/* Track + thumb */}
      <div
        ref={trackRef}
        role="slider"
        id={sliderId}
        aria-label={ariaLabel}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={ariaValueText ?? formatValue(value, min, max)}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative flex h-5 flex-1 cursor-pointer items-center',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
          'focus-visible:rounded',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        {/* Track */}
        <div className="h-1 w-full overflow-hidden rounded-pill bg-glass-border">
          {/* Fill */}
          <div
            aria-hidden="true"
            className="h-full rounded-pill bg-accent transition-none"
            style={{ width: `${fillPct}%` }}
          />
        </div>
        {/* Thumb */}
        <div
          aria-hidden="true"
          className="absolute h-4 w-4 -translate-x-1/2 rounded-full bg-accent shadow-lift"
          style={{ left: `${fillPct}%` }}
        />
      </div>

      {/* Value readout */}
      {showValue && (
        <span
          aria-hidden="true"
          className="w-10 shrink-0 text-right font-sans text-small text-ink-500 tabular-nums"
        >
          {formatValue(value, min, max)}
        </span>
      )}
    </div>
  );
});
