import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from './storage';

describe('storage utility', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores and retrieves primitive values', () => {
    expect(storage.setItem('count', 42)).toBe(true);
    expect(storage.getItem('count', 0)).toBe(42);

    expect(storage.setItem('user', 'Mochi')).toBe(true);
    expect(storage.getItem('user', '')).toBe('Mochi');

    expect(storage.setItem('active', true)).toBe(true);
    expect(storage.getItem('active', false)).toBe(true);
  });

  it('stores and retrieves complex objects and arrays', () => {
    const data = { theme: 'cozy', scenes: ['rain', 'cafe'], volume: 0.8 };
    expect(storage.setItem('settings', data)).toBe(true);
    expect(storage.getItem('settings', { theme: 'default' })).toEqual(data);
  });

  it('returns fallback value if key does not exist', () => {
    expect(storage.getItem('nonexistent', 'fallback-val')).toBe('fallback-val');
    expect(storage.getItem('nonexistent-obj', { fallback: true })).toEqual({ fallback: true });
  });

  it('removes an item correctly', () => {
    storage.setItem('temp', 'value');
    expect(storage.getItem('temp', null)).toBe('value');
    expect(storage.removeItem('temp')).toBe(true);
    expect(storage.getItem('temp', 'gone')).toBe('gone');
  });

  it('clears all items correctly', () => {
    storage.setItem('a', 1);
    storage.setItem('b', 2);
    expect(storage.clear()).toBe(true);
    expect(storage.getItem('a', 0)).toBe(0);
    expect(storage.getItem('b', 0)).toBe(0);
  });

  it('handles invalid JSON gracefully without throwing', () => {
    localStorage.setItem('corrupted', '{ invalid json ...');
    expect(storage.getItem('corrupted', 'safe-fallback')).toBe('safe-fallback');
  });

  it('handles localStorage.setItem quota/security exceptions gracefully', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    const result = storage.setItem('overflow', { data: 'big' });
    expect(result).toBe(false);
  });

  it('handles localStorage.getItem security exceptions gracefully', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied');
    });

    const result = storage.getItem('restricted', 'fallback');
    expect(result).toBe('fallback');
  });

  it('handles localStorage.removeItem security exceptions gracefully', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Access denied');
    });

    const result = storage.removeItem('restricted');
    expect(result).toBe(false);
  });

  it('handles localStorage.clear security exceptions gracefully', () => {
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      throw new DOMException('Access denied');
    });

    const result = storage.clear();
    expect(result).toBe(false);
  });
});
