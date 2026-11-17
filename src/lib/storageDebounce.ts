import type { StateStorage } from 'zustand/middleware';

export interface DebouncedStorageOptions {
  delayMs?: number;
  baseStorage?: Storage | null;
}

export class DebouncedStorageManager implements StateStorage {
  private baseStorage: Storage | null;
  private delayMs: number;
  private pending = new Map<string, string>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private isListening = false;

  constructor(options?: DebouncedStorageOptions) {
    this.delayMs = options?.delayMs ?? 500;
    this.baseStorage =
      options?.baseStorage !== undefined
        ? options.baseStorage
        : typeof window !== 'undefined'
          ? window.localStorage
          : null;

    this.setupListeners();
  }

  private setupListeners(): void {
    if (this.isListening || typeof window === 'undefined') return;

    const flushAll = () => this.flush();

    window.addEventListener('visibilitychange', () => {
      if (document.hidden) flushAll();
    });
    window.addEventListener('pagehide', flushAll);
    window.addEventListener('beforeunload', flushAll);
    this.isListening = true;
  }

  public getItem(name: string): string | null {
    if (this.pending.has(name)) {
      return this.pending.get(name) ?? null;
    }
    if (!this.baseStorage) return null;
    try {
      return this.baseStorage.getItem(name);
    } catch {
      return null;
    }
  }

  public setItem(name: string, value: string): void {
    this.pending.set(name, value);

    const existingTimer = this.timers.get(name);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.flushKey(name);
    }, this.delayMs);

    this.timers.set(name, timer);
  }

  public removeItem(name: string): void {
    const timer = this.timers.get(name);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(name);
    }
    this.pending.delete(name);
    if (this.baseStorage) {
      try {
        this.baseStorage.removeItem(name);
      } catch {
        // Silently ignore storage errors
      }
    }
  }

  public flushKey(name: string): void {
    const timer = this.timers.get(name);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(name);
    }

    if (this.pending.has(name) && this.baseStorage) {
      const value = this.pending.get(name)!;
      try {
        this.baseStorage.setItem(name, value);
      } catch {
        // Quota exceeded or private browsing error caught safely
      }
      this.pending.delete(name);
    }
  }

  public flush(): void {
    for (const name of Array.from(this.pending.keys())) {
      this.flushKey(name);
    }
  }

  public getPendingKeys(): string[] {
    return Array.from(this.pending.keys());
  }
}

export const debouncedStorage = new DebouncedStorageManager();
