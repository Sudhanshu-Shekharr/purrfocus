import React, { useId, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { transitionBase } from '@/lib/motion';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedTabsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  className?: string;
  id?: string;
  controlsId?: string;
};

/**
 * Accessible segmented tab control with a Framer Motion sliding active pill.
 *
 * Keyboard: Arrow Left/Right, Home, End within the tablist.
 * ARIA: role="tablist" → role="tab" with aria-selected and aria-controls.
 * The sliding pill uses a unique layoutId per instance to prevent cross-component interference.
 */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  className,
  id: externalId,
  controlsId,
}: SegmentedTabsProps<T>): React.ReactElement {
  const innerId = useId();
  const id = externalId ?? innerId;
  const layoutId = `segmented-pill-${id}`;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const current = options.findIndex(o => o.value === value);

      switch (e.key) {
        case 'ArrowRight': {
          e.preventDefault();
          const next = (current + 1) % options.length;
          const opt = options[next];
          if (opt) {
            onChange(opt.value);
            tabRefs.current[next]?.focus();
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          const prev = (current - 1 + options.length) % options.length;
          const opt = options[prev];
          if (opt) {
            onChange(opt.value);
            tabRefs.current[prev]?.focus();
          }
          break;
        }
        case 'Home': {
          e.preventDefault();
          const opt = options[0];
          if (opt) {
            onChange(opt.value);
            tabRefs.current[0]?.focus();
          }
          break;
        }
        case 'End': {
          e.preventDefault();
          const last = options.length - 1;
          const opt = options[last];
          if (opt) {
            onChange(opt.value);
            tabRefs.current[last]?.focus();
          }
          break;
        }
        default:
          break;
      }
    },
    [options, value, onChange],
  );

  return (
    <div
      id={id}
      role="tablist"
      aria-label="Session type"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={cn(
        'glass relative inline-flex rounded-pill p-1 gap-1',
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {options.map((option, idx) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              ref={el => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={controlsId}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(option.value)}
              className={cn(
                'relative z-[1] rounded-pill px-4 py-1.5 font-sans text-small font-medium',
                'transition-colors duration-base ease-soft outline-none',
                'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
                isSelected ? 'text-ink-900' : 'text-ink-500 hover:text-ink-700',
              )}
            >
              {/* Sliding active pill behind text */}
              {isSelected && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-pill bg-glass-strong shadow-card"
                  transition={transitionBase}
                  aria-hidden="true"
                />
              )}
              <span className="relative">{option.label}</span>
            </button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
