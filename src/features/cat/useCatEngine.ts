import { useEffect, useRef } from 'react';
import { initCatController, useCatRuntimeStore } from './controller';

const ACTIVITY_THROTTLE_MS = 2000;

/**
 * Mounts the cat engine controller and connects window activity listeners
 * for wake-up and idle sleepy timer resetting.
 */
export function useCatEngine(): void {
  const lastActivityRef = useRef<number>(0);

  useEffect(() => {
    const cleanupController = initCatController();

    const handleActivity = (): void => {
      const now = Date.now();
      if (now - lastActivityRef.current > ACTIVITY_THROTTLE_MS) {
        lastActivityRef.current = now;
        useCatRuntimeStore.getState().handleUserActivity(now);
      }
    };

    window.addEventListener('pointermove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('pointerdown', handleActivity, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('pointerdown', handleActivity);
      cleanupController();
    };
  }, []);
}
