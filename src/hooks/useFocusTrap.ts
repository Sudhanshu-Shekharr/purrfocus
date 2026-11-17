import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]:not([aria-hidden])',
  'button:not([disabled]):not([aria-hidden])',
  'input:not([disabled]):not([aria-hidden])',
  'select:not([disabled]):not([aria-hidden])',
  'textarea:not([disabled]):not([aria-hidden])',
  '[tabindex]:not([tabindex="-1"]):not([aria-hidden])',
  'details > summary:not([aria-hidden])',
].join(', ');

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Traps keyboard focus within `containerRef` when `enabled` is true.
 * Focuses the first focusable element on activation.
 * Wraps Tab / Shift+Tab at the boundaries.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    // Focus the first focusable element immediately
    const focusable = getFocusable(container);
    focusable[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;

      const items = getFocusable(container);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const first = items[0] as HTMLElement;
      const last = items[items.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, enabled]);
}
