import type { BurstOptions } from './types';

export type FxBurstPayload = BurstOptions;

type FxListener = (payload: FxBurstPayload) => void;

class FxEmitter {
  private burstListeners = new Set<FxListener>();

  public on(type: 'burst', listener: FxListener): () => void {
    if (type === 'burst') {
      this.burstListeners.add(listener);
    }
    return () => {
      this.burstListeners.delete(listener);
    };
  }

  public emit(type: 'burst', payload: FxBurstPayload): void {
    if (type === 'burst') {
      for (const listener of this.burstListeners) {
        try {
          listener(payload);
        } catch {
          // Prevent listener error from bubbling
        }
      }
    }
  }
}

export const fx = new FxEmitter();
