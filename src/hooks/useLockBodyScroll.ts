import { useEffect } from 'react';

/**
 * Prevents the document body from scrolling while the component is mounted.
 * Restores the original overflow value on cleanup.
 */
export function useLockBodyScroll(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = original;
    };
  }, [enabled]);
}
