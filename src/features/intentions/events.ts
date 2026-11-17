import type { Task } from './types';

export type IntentionEvent =
  | { type: 'taskDone'; task: Task }
  | { type: 'pomodoroCounted'; taskId: string; sessionId?: string };

export type IntentionListener = (event: IntentionEvent) => void;

const listeners = new Set<IntentionListener>();

export function emitIntention(event: IntentionEvent): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener(event);
    } catch {
      // Prevent listener failure from disrupting caller
    }
  }
}

export function subscribeIntention(listener: IntentionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function _clearIntentionListenersForTest(): void {
  listeners.clear();
}
