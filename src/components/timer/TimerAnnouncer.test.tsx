import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TimerAnnouncer } from './TimerAnnouncer';
import { useTimerStore } from '@/features/timer/store';

describe('TimerAnnouncer live-region throttling (§6.3)', () => {
  beforeEach(() => {
    useTimerStore.setState({
      mode: 'focus',
      status: 'idle',
      remaining: 1500,
      durations: { focus: 1500, shortBreak: 300, longBreak: 900 },
      endsAt: null,
    });
  });

  it('announces on start and at whole-minute boundaries over 180s, never every second', () => {
    const announcements: string[] = [];

    render(<TimerAnnouncer />);

    const liveRegion = screen.getByRole('status');

    // 1. Start session
    act(() => {
      useTimerStore.getState().start();
    });

    if (liveRegion.textContent) {
      announcements.push(liveRegion.textContent);
    }
    expect(liveRegion).toHaveTextContent(/Focus session started, 25 minutes remaining/i);

    // 2. Simulate 180 seconds ticking one second at a time
    for (let sec = 1; sec <= 180; sec++) {
      const remainingSeconds = 1500 - sec;

      act(() => {
        useTimerStore.setState({
          remaining: remainingSeconds,
        });
      });

      const currentText = liveRegion.textContent || '';
      const lastRecorded = announcements[announcements.length - 1];

      // If announcement changed, record it
      if (currentText !== lastRecorded) {
        announcements.push(currentText);
      }
    }

    // Over 180 seconds, announcements must strictly be:
    // 1. Start (25 min)
    // 2. At 60s elapsed -> 24:00 (24 minutes remaining)
    // 3. At 120s elapsed -> 23:00 (23 minutes remaining)
    // 4. At 180s elapsed -> 22:00 (22 minutes remaining)
    expect(announcements).toHaveLength(4);
    expect(announcements[0]).toMatch(/Focus session started, 25 minutes remaining/i);
    expect(announcements[1]).toBe('24 minutes remaining');
    expect(announcements[2]).toBe('23 minutes remaining');
    expect(announcements[3]).toBe('22 minutes remaining');
  });

  it('announces when session ends', () => {
    render(<TimerAnnouncer />);
    const liveRegion = screen.getByRole('status');

    act(() => {
      useTimerStore.getState().start();
    });

    act(() => {
      useTimerStore.getState().finish();
    });

    expect(liveRegion).toHaveTextContent(/Focus complete\. Time for a break\./i);
  });
});
