import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  TopBarClock,
  formatClockDisplay,
  formatClockAriaLabel,
} from './TopBarClock';

describe('TopBarClock formatting & unit logic', () => {
  it('formats time with local hours and minutes in 12h mode', () => {
    // 2026-11-17 14:05:30 UTC
    const date = new Date(2026, 10, 17, 14, 5, 30);
    const result = formatClockDisplay(date, '12h');
    expect(result).toMatch(/2:05\s*(PM|pm)?/);
  });

  it('formats time in 24h mode without AM/PM', () => {
    const date = new Date(2026, 10, 17, 14, 5, 30);
    const result = formatClockDisplay(date, '24h');
    expect(result).toMatch(/14:05/);
  });

  it('provides an accessible aria-label with "Current time"', () => {
    const date = new Date(2026, 10, 17, 9, 30, 0);
    const label = formatClockAriaLabel(date, '12h');
    expect(label).toContain('Current time');
    expect(label).toMatch(/9:30/);
  });

  it('reads only device clock without making network time requests', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const date = new Date(2026, 10, 17, 10, 0, 0);
    formatClockDisplay(date);
    formatClockAriaLabel(date);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('TopBarClock component lifecycle & synchronization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders time and accessible label', () => {
    const fixedDate = new Date(2026, 10, 17, 9, 30, 0);
    vi.setSystemTime(fixedDate);

    render(<TopBarClock format="12h" className="hidden min-[480px]:inline-flex" />);

    const clockEl = screen.getByTestId('topbar-live-clock');
    expect(clockEl).toBeInTheDocument();
    expect(clockEl).toHaveClass('hidden');
    expect(clockEl).toHaveClass('min-[480px]:inline-flex');
    expect(clockEl).toHaveAttribute('aria-label', expect.stringContaining('Current time'));
    expect(clockEl).toHaveTextContent(/9:30/);
  });

  it('aligns to second boundary and updates as time ticks', () => {
    // Start at 09:30:45.300 (300ms past the second)
    const baseDate = new Date(2026, 10, 17, 9, 30, 45, 300);
    vi.setSystemTime(baseDate);

    render(<TopBarClock format="12h" />);

    // Advance 700ms to hit the exact second boundary
    act(() => {
      vi.advanceTimersByTime(700);
    });

    // Advance 15 seconds to flip the minute (to 09:31:00)
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    const clockEl = screen.getByTestId('topbar-live-clock');
    expect(clockEl).toHaveTextContent(/9:31/);
    expect(clockEl).toHaveAttribute('aria-label', expect.stringContaining('9:31'));
  });

  it('pauses updates when document is hidden and resyncs on visibilitychange', () => {
    const startDate = new Date(2026, 10, 17, 9, 30, 0);
    vi.setSystemTime(startDate);

    render(<TopBarClock format="12h" />);
    const clockEl = screen.getByTestId('topbar-live-clock');
    expect(clockEl).toHaveTextContent(/9:30/);

    // Simulate tab becoming hidden
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    // Advance time by 5 minutes while tab is hidden
    act(() => {
      vi.advanceTimersByTime(300000);
    });

    // Simulate tab becoming visible again
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Clock immediately resyncs to device time (9:35)
    expect(clockEl).toHaveTextContent(/9:35/);
    expect(clockEl).toHaveAttribute('aria-label', expect.stringContaining('9:35'));
  });
});
