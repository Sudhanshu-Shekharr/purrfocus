import React, { useId, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type TooltipProps = {
  /** Tooltip content */
  content: React.ReactNode;
  /** Element that triggers the tooltip */
  children: React.ReactElement;
  /** Delay in ms before the tooltip appears (default: 400) */
  delay?: number;
  className?: string;
};

/**
 * Tooltip — appears on hover and keyboard focus of the child element.
 *
 * Accessibility:
 * - role="tooltip" on the popup
 * - aria-describedby on the trigger links tooltip content
 * - Respects prefers-reduced-motion (no fade, instant show/hide)
 */
export function Tooltip({ content, children, delay = 400, className }: TooltipProps): React.ReactElement {
  const id = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = React.useState(false);
  const reduced = useReducedMotion();

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), reduced ? 0 : delay);
  }, [delay, reduced]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const trigger = React.cloneElement(children, {
    'aria-describedby': visible ? id : undefined,
    onMouseEnter: (e: React.MouseEvent) => {
      show();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hide();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      show();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hide();
      children.props.onBlur?.(e);
    },
  });

  return (
    <span className="relative inline-flex">
      {trigger}
      <AnimatePresence>
        {visible && (
          <motion.span
            id={id}
            role="tooltip"
            initial={reduced ? {} : { opacity: 0, y: 4 }}
            animate={reduced ? {} : { opacity: 1, y: 0 }}
            exit={reduced ? {} : { opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'pointer-events-none absolute bottom-full left-1/2 z-popover mb-2',
              '-translate-x-1/2 whitespace-nowrap',
              'glass rounded-lg px-3 py-1.5',
              'font-sans text-small text-ink-700 shadow-pop',
              className,
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
