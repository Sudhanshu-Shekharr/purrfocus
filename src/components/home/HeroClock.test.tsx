import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  HeroClock,
  formatClockDisplay,
  formatClockAriaLabel,
} from './HeroClock';

describe('HeroClock formatting & unit logic', () => {
  it('formats time with local hours and minutes in 12h mode', () => {
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

describe('HeroClock component lifecycle & styling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders time, cream token (text-surface), soft scrim, and polite ARIA live region', () => {
    const fixedDate = new Date(2026, 10, 17, 9, 30, 0);
    vi.setSystemTime(fixedDate);

    render(<HeroClock format="12h" className="custom-class" />);

    const clockEl = screen.getByTestId('hero-live-clock');
    expect(clockEl).toBeInTheDocument();
    expect(clockEl).toHaveClass('custom-class');
    // Cream token from design system
    expect(clockEl).toHaveClass('text-surface');
    // Soft scrim for WCAG AA contrast (>= 4.5:1)
    expect(clockEl).toHaveClass('bg-ink-900/60');
    expect(clockEl).toHaveClass('backdrop-blur-md');
    // Accessible live region
    expect(clockEl).toHaveAttribute('aria-live', 'polite');
    expect(clockEl).toHaveAttribute('aria-label', expect.stringContaining('Current time'));
    expect(clockEl).toHaveTextContent(/9:30/);
  });

  it('aligns to second boundary and updates as time ticks', () => {
    const baseDate = new Date(2026, 10, 17, 9, 30, 45, 300);
    vi.setSystemTime(baseDate);

    render(<HeroClock format="12h" />);

    act(() => {
      vi.advanceTimersByTime(700);
    });

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    const clockEl = screen.getByTestId('hero-live-clock');
    expect(clockEl).toHaveTextContent(/9:31/);
    expect(clockEl).toHaveAttribute('aria-label', expect.stringContaining('9:31'));
  });

  it('pauses updates when document is hidden and resyncs on visibilitychange', () => {
    const startDate = new Date(2026, 10, 17, 9, 30, 0);
    vi.setSystemTime(startDate);

    render(<HeroClock format="12h" />);
    const clockEl = screen.getByTestId('hero-live-clock');
    expect(clockEl).toHaveTextContent(/9:30/);

    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    act(() => {
      vi.advanceTimersByTime(300000);
    });

    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(clockEl).toHaveTextContent(/9:35/);
    expect(clockEl).toHaveAttribute('aria-label', expect.stringContaining('9:35'));
  });
});
