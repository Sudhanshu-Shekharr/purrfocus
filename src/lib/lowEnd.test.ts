import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isLowEndDevice, initLowEndDetection } from './lowEnd';

describe('lowEnd hardware detection', () => {
  const originalNavigator = window.navigator;

  beforeEach(() => {
    delete document.documentElement.dataset.perf;
  });

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
    delete document.documentElement.dataset.perf;
  });

  it('detects low-end device when hardwareConcurrency <= 4', () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        hardwareConcurrency: 4,
        deviceMemory: 8,
      },
      configurable: true,
      writable: true,
    });

    expect(isLowEndDevice()).toBe(true);
    expect(initLowEndDetection()).toBe(true);
    expect(document.documentElement.dataset.perf).toBe('low');
  });

  it('detects low-end device when deviceMemory <= 4 GB', () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        hardwareConcurrency: 8,
        deviceMemory: 2,
      },
      configurable: true,
      writable: true,
    });

    expect(isLowEndDevice()).toBe(true);
    expect(initLowEndDetection()).toBe(true);
    expect(document.documentElement.dataset.perf).toBe('low');
  });

  it('does NOT mark high-spec device as low-end (e.g. 8 cores, 16GB)', () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        hardwareConcurrency: 8,
        deviceMemory: 16,
      },
      configurable: true,
      writable: true,
    });

    expect(isLowEndDevice()).toBe(false);
    expect(initLowEndDetection()).toBe(false);
    expect(document.documentElement.dataset.perf).toBeUndefined();
  });
});
