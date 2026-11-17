import React, { useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { transitionBase, transitionSlow } from '@/lib/motion';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** 'center' renders a dialog; 'bottom' slides up; 'right' slides in from right */
  variant?: 'center' | 'bottom' | 'right';
  title: string;
  /** Whether to show the title in the modal header */
  showTitle?: boolean;
  children: React.ReactNode;
  /** Pinned footer element at the bottom of the modal */
  footer?: React.ReactNode;
  className?: string;
  id?: string;
};

/**
 * Accessible modal dialog / bottom sheet.
 *
 * Features: portal rendering, scrim, focus trap, Esc + scrim-click to close,
 * scroll lock, restores focus on close, aria-modal, aria-labelledby.
 */
export function Modal({
  open,
  onClose,
  variant = 'center',
  title,
  showTitle = true,
  children,
  footer,
  className,
  id: externalId,
}: ModalProps): React.ReactElement {
  const innerId = useId();
  const id = externalId ?? innerId;
  const titleId = `${id}-title`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // Remember previously focused element before opening
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (open) {
      previousFocusRef.current = document.activeElement;
    } else {
      // Restore focus on close
      timer = setTimeout(() => {
        if (typeof HTMLElement !== 'undefined' && previousFocusRef.current instanceof HTMLElement) {
          previousFocusRef.current.focus();
        }
      }, 10);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open]);

  useFocusTrap(dialogRef, open);
  useLockBodyScroll(open);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  const isBottom = variant === 'bottom';
  const isRight = variant === 'right';

  const initialMotion = isRight
    ? { x: '100%' }
    : isBottom
      ? { y: '100%' }
      : { opacity: 0, scale: 0.95, y: -8 };

  const animateMotion = isRight
    ? { x: 0 }
    : isBottom
      ? { y: 0 }
      : { opacity: 1, scale: 1, y: 0 };

  const exitMotion = isRight
    ? { x: '100%' }
    : isBottom
      ? { y: '100%' }
      : { opacity: 0, scale: 0.95, y: -8 };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitionBase}
            onClick={onClose}
            className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm"
            style={{ zIndex: 'var(--z-modal)' }}
          />

          {/* Dialog Container */}
          <div
            className={cn(
              'fixed inset-0 flex pointer-events-none',
              isRight
                ? 'items-stretch justify-end'
                : isBottom
                  ? 'items-end justify-center'
                  : 'items-center justify-center p-4',
            )}
            style={{ zIndex: 'calc(var(--z-modal) + 1)' }}
          >
            <motion.div
              ref={dialogRef}
              id={id}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onKeyDown={handleKeyDown}
              initial={initialMotion}
              animate={animateMotion}
              exit={exitMotion}
              transition={isBottom || isRight ? transitionSlow : transitionBase}
              className={cn(
                'glass-strong shadow-pop max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden pointer-events-auto',
                isRight
                  ? 'h-full w-full max-w-md rounded-l-card overflow-y-auto pb-safe'
                  : isBottom
                    ? 'bottom-0 left-0 right-0 w-full rounded-t-card pb-safe'
                    : 'w-full max-w-md rounded-card',
                className,
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 sm:pt-8 pb-4 shrink-0">
                <h2
                  id={titleId}
                  className={cn(
                    'font-serif text-title text-ink-900',
                    !showTitle && 'sr-only',
                  )}
                >
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className={cn(
                    'ml-auto -mr-2 rounded-full p-2',
                    'text-ink-500 transition-colors duration-fast ease-soft',
                    'hover:bg-glass hover:text-ink-900',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  )}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* Content (scrolls internally) */}
              <div className={cn('px-6 overflow-y-auto flex-1 min-h-0', !footer && 'pb-6')}>
                {children}
              </div>

              {/* Pinned Footer */}
              {footer && (
                <div className="px-6 py-4 border-t border-glass-border/40 shrink-0 bg-surface/30 backdrop-blur-xs">
                  {footer}
                </div>
              )}

              {/* Bottom sheet drag handle */}
              {isBottom && (
                <div
                  aria-hidden="true"
                  className="absolute top-2.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-pill bg-glass-border"
                />
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
