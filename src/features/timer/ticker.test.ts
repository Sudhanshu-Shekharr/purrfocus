import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTimerStore } from './store';
import { getInitialTimerState, DEFAULT_DURATIONS } from './constants';
import { createTicker } from './ticker';

describe('Ticker & Background-Tab Accuracy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useTimerStore.setState(getInitialTimerState('2026-10-28'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('computes exact remaining time after 5 minutes jump with zero ticks in between', () => {
    const t0 = 1000000;
    vi.setSystemTime(t0);

    useTimerStore.getState().start();
    expect(useTimerStore.getState().remaining).toBe(DEFAULT_DURATIONS.focus); // 1500

    // Advance system time by exactly 5 minutes (300,000 ms) with NO ticks
    vi.setSystemTime(t0 + 300 * 1000);

    // Fire one tick
    useTimerStore.getState().tick(t0 + 300 * 1000);

    // Remaining should be exactly 1500 - 300 = 1200
    expect(useTimerStore.getState().remaining).toBe(1200);
  });

  it('recalculates on visibilitychange when returning to tab', () => {
    const t0 = 1000000;
    vi.setSystemTime(t0);

    useTimerStore.getState().start();

    let ticked = false;
    const ticker = createTicker(() => {
      ticked = true;
      useTimerStore.getState().tick(Date.now());
    });

    ticker.start();

    // Advance 60 seconds while tab was hidden
    vi.setSystemTime(t0 + 60 * 1000);
    expect(ticked).toBe(false);

    // Tab becomes visible
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(ticked).toBe(true);
    expect(useTimerStore.getState().remaining).toBe(DEFAULT_DURATIONS.focus - 60);

    ticker.destroy();
  });

  it('finishes exactly once when advancing past endsAt with zero intermediate ticks (sleep case)', () => {
    const t0 = 1000000;
    vi.setSystemTime(t0);

    useTimerStore.getState().start();
    expect(useTimerStore.getState().status).toBe('running');

    // System sleep / tab throttle: time jumps past total duration (1500s + 10s)
    vi.setSystemTime(t0 + (DEFAULT_DURATIONS.focus + 10) * 1000);

    useTimerStore.getState().tick(t0 + (DEFAULT_DURATIONS.focus + 10) * 1000);

    expect(useTimerStore.getState().status).toBe('finished');
    expect(useTimerStore.getState().remaining).toBe(0);
    expect(useTimerStore.getState().completedFocusSessions).toBe(1);

    // Additional ticks do not change anything
    useTimerStore.getState().tick(t0 + (DEFAULT_DURATIONS.focus + 20) * 1000);
    expect(useTimerStore.getState().completedFocusSessions).toBe(1);
  });
});
