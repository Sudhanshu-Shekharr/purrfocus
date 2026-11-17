/**
 * Detects whether the current device is a lower-end client based on hardware concurrency
 * (logical CPU cores <= 4) or available device memory (RAM <= 4 GB).
 */
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // 1. Hardware concurrency (logical processor cores)
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === 'number' && cores > 0 && cores <= 4) {
    return true;
  }

  // 2. Device memory (RAM in GB, Chrome/Edge API)
  const nav = navigator as unknown as { deviceMemory?: number };
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 && nav.deviceMemory <= 4) {
    return true;
  }

  return false;
}

/**
 * Initializes performance tier detection and attaches `data-perf="low"` to root <html>
 * element when running on resource-constrained hardware.
 */
export function initLowEndDetection(): boolean {
  const isLow = isLowEndDevice();
  if (typeof document !== 'undefined') {
    if (isLow) {
      document.documentElement.dataset.perf = 'low';
    } else {
      delete document.documentElement.dataset.perf;
    }
  }
  return isLow;
}
