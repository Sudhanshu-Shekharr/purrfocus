import { useEffect } from 'react';
import type { Mode } from './types';

export type TimerEventType =
  | 'start'
  | 'pause'
  | 'resume'
  | 'reset'
  | 'finish'
  | 'modeChange'
  | 'recovered';

export type TimerEvent = {
  type: TimerEventType;
  mode: Mode;
  completedFocusSessions: number;
  autoStarted?: boolean;
};

export type TimerEventHandler = (event: TimerEvent) => void;

const listeners = new Set<TimerEventHandler>();

export function emitTimerEvent(event: TimerEvent): void {
  listeners.forEach(handler => {
    try {
      handler(event);
    } catch {
      // Don't let an error in one listener crash other listeners
    }
  });
}

export function subscribeTimerEvents(handler: TimerEventHandler): () => void {
  listeners.add(handler);
  return () => {
    listeners.delete(handler);
  };
}

export function useTimerEvents(handler: TimerEventHandler): void {
  useEffect(() => {
    return subscribeTimerEvents(handler);
  }, [handler]);
}
