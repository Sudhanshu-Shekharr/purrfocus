import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DebouncedStorageManager } from './storageDebounce';

describe('DebouncedStorageManager', () => {
  let mockStorage: Storage;
  let store: Record<string, string>;

  beforeEach(() => {
    vi.useFakeTimers();
    store = {};
    mockStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces storage writes and flushes after delay', () => {
    const manager = new DebouncedStorageManager({
      baseStorage: mockStorage,
      delayMs: 500,
    });

    manager.setItem('key1', 'value1');
    manager.setItem('key1', 'value2');

    // Immediately, baseStorage has not been called
    expect(mockStorage.setItem).not.toHaveBeenCalled();

    // Pending value is immediately readable via getItem
    expect(manager.getItem('key1')).toBe('value2');

    // Advance 499ms: still not written
    vi.advanceTimersByTime(499);
    expect(mockStorage.setItem).not.toHaveBeenCalled();

    // Advance 1ms: written exactly once with latest value
    vi.advanceTimersByTime(1);
    expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
    expect(mockStorage.setItem).toHaveBeenCalledWith('key1', 'value2');
    expect(store['key1']).toBe('value2');
  });

  it('flushes pending writes immediately when flush() is invoked', () => {
    const manager = new DebouncedStorageManager({
      baseStorage: mockStorage,
      delayMs: 500,
    });

    manager.setItem('prefs', '{"sfxOn":true}');
    manager.setItem('stats', '{"total":10}');

    expect(mockStorage.setItem).not.toHaveBeenCalled();

    manager.flush();

    expect(mockStorage.setItem).toHaveBeenCalledTimes(2);
    expect(store['prefs']).toBe('{"sfxOn":true}');
    expect(store['stats']).toBe('{"total":10}');
    expect(manager.getPendingKeys()).toHaveLength(0);
  });

  it('removeItem clears pending write and removes from baseStorage', () => {
    const manager = new DebouncedStorageManager({
      baseStorage: mockStorage,
      delayMs: 500,
    });

    manager.setItem('key1', 'value1');
    manager.removeItem('key1');

    vi.advanceTimersByTime(1000);
    expect(mockStorage.setItem).not.toHaveBeenCalled();
    expect(mockStorage.removeItem).toHaveBeenCalledWith('key1');
  });

  it('handles baseStorage write errors without throwing', () => {
    mockStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const manager = new DebouncedStorageManager({
      baseStorage: mockStorage,
      delayMs: 500,
    });

    expect(() => {
      manager.setItem('test', '123');
      manager.flush();
    }).not.toThrow();
  });
});
