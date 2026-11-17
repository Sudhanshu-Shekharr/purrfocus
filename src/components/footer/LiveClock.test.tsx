import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LiveClock, formatTime } from './LiveClock';
import { usePrefsStore } from '@/features/prefs/store';

describe('LiveClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 23, 22, 30, 0)); // 22:30:00 / 10:30:00 PM
    usePrefsStore.getState().resetPrefs();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial formatted time', () => {
    render(<LiveClock />);
    const clockEl = screen.getByTestId('live-clock');
    expect(clockEl).toBeInTheDocument();
    expect(clockEl.textContent).toBeTruthy();
  });

  it('updates time every second with fake timers', () => {
    render(<LiveClock />);
    const clockEl = screen.getByTestId('live-clock');

    // Advance 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(clockEl.textContent).toMatch(/10:30:05/);

    // Advance another 25 seconds
    act(() => {
      vi.advanceTimersByTime(25000);
    });

    expect(clockEl.textContent).toMatch(/10:30:30/);
  });

  it('respects 12h and 24h format props and store settings', () => {
    const d = new Date(2026, 9, 23, 22, 15, 30);

    const f12 = formatTime(d, '12h');
    const f24 = formatTime(d, '24h');

    expect(f12).toMatch(/10:15:30/);
    expect(f24).toMatch(/22:15:30/);

    // Test with prop
    const { rerender } = render(<LiveClock format="24h" />);
    expect(screen.getByTestId('live-clock').textContent).toMatch(/22:30:00/);

    rerender(<LiveClock format="12h" />);
    expect(screen.getByTestId('live-clock').textContent).toMatch(/10:30:00/);
  });
});
