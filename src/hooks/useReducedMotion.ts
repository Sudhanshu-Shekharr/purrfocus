import { useMediaQuery } from './useMediaQuery';
import { usePrefsStore } from '@/features/prefs/store';

/**
 * Returns true when animations should be reduced or disabled.
 * Respects user override in purrfocus preferences:
 * - 'on': always reduce motion (treat as true)
 * - 'off': motion enabled (ignores OS preference for this app)
 * - 'system': follows OS / browser prefers-reduced-motion media query
 */
export function useReducedMotion(): boolean {
  const osPrefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const override = usePrefsStore(state => state.reduceMotion);

  if (override === 'on') return true;
  if (override === 'off') return false;
  return osPrefersReduced;
}
