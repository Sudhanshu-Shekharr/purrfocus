import { useEffect, useRef } from 'react';
import { useTimerStore } from './store';

export type TickerController = {
  start: () => void;
  stop: () => void;
  destroy: () => void;
};

export function createTicker(onTick: () => void): TickerController {
  let worker: Worker | null = null;
  let fallbackInterval: ReturnType<typeof setInterval> | null = null;
  let isRunning = false;

  const handleVisibilityChange = (): void => {
    if (typeof document !== 'undefined' && !document.hidden && isRunning) {
      onTick();
    }
  };

  try {
    if (typeof Worker !== 'undefined') {
      worker = new Worker(new URL('./tick.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = (e: MessageEvent<{ type: string }>) => {
        if (e.data?.type === 'tick' && isRunning) {
          onTick();
        }
      };
    }
  } catch {
    worker = null;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  const start = (): void => {
    if (isRunning) return;
    isRunning = true;

    if (worker) {
      worker.postMessage({ type: 'start' });
    } else {
      if (fallbackInterval !== null) clearInterval(fallbackInterval);
      fallbackInterval = setInterval(() => {
        if (isRunning) onTick();
      }, 250);
    }
  };

  const stop = (): void => {
    if (!isRunning) return;
    isRunning = false;

    if (worker) {
      worker.postMessage({ type: 'stop' });
    }
    if (fallbackInterval !== null) {
      clearInterval(fallbackInterval);
      fallbackInterval = null;
    }
  };

  const destroy = (): void => {
    stop();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
    if (worker) {
      worker.terminate();
      worker = null;
    }
  };

  return { start, stop, destroy };
}

/**
 * React hook mounted once in AppShell or Home that keeps the ticker
 * running while the timer status is 'running'.
 */
export function useTimerTicker(): void {
  const status = useTimerStore(s => s.status);
  const controllerRef = useRef<TickerController | null>(null);

  useEffect(() => {
    const controller = createTicker(() => {
      useTimerStore.getState().tick(Date.now());
    });
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    if (status === 'running') {
      controller.start();
    } else {
      controller.stop();
    }
  }, [status]);
}
