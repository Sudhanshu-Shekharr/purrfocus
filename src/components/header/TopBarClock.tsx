import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { usePrefsStore } from '@/features/prefs/store';
import type { ClockFormat } from '@/features/prefs/types';
import { cn } from '@/lib/cn';

export interface TopBarClockProps {
  className?: string;
  format?: ClockFormat;
}

/**
 * Format local device time using Intl.DateTimeFormat (hours and minutes).
 * Uses device time only; no network requests.
 */
export function formatClockDisplay(date: Date, format: ClockFormat = 'auto'): string {
  try {
    const hour12 = format === '12h' ? true : format === '24h' ? false : undefined;
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12,
    }).format(date);
  } catch {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
}

/**
 * Accessible label updated once per minute to avoid screen-reader spam.
 */
export function formatClockAriaLabel(date: Date, format: ClockFormat = 'auto'): string {
  const timeStr = formatClockDisplay(date, format);
  return `Current time ${timeStr}`;
}

/**
 * Top bar live clock updating on exact second boundaries.
 * Pauses on hidden tabs, resumes and resyncs on visibilitychange.
 */
export const TopBarClock: React.FC<TopBarClockProps> = ({
  className = '',
  format: propFormat,
}) => {
  const prefFormat = usePrefsStore(state => state.clockFormat);
  const effectiveFormat = propFormat ?? prefFormat;

  const [displayTime, setDisplayTime] = useState<string>(() =>
    formatClockDisplay(new Date(), effectiveFormat),
  );
  const [ariaLabel, setAriaLabel] = useState<string>(() =>
    formatClockAriaLabel(new Date(), effectiveFormat),
  );

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let lastMinute = -1;

    const tick = () => {
      // Read time exclusively from the local device clock
      const now = new Date();
      const currentMinute = now.getMinutes();

      setDisplayTime(formatClockDisplay(now, effectiveFormat));

      // Update accessible label once each minute to avoid screen-reader announcements every second
      if (currentMinute !== lastMinute) {
        lastMinute = currentMinute;
        setAriaLabel(formatClockAriaLabel(now, effectiveFormat));
      }

      // Schedule next tick aligned to exact second boundary without drift
      const msUntilNextSecond = 1000 - (Date.now() % 1000);
      timerId = setTimeout(tick, msUntilNextSecond);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
      } else {
        // Tab is visible again: immediately resync and start tick loop
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!document.hidden) {
      tick();
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [effectiveFormat]);

  return (
    <time
      className={cn(
        'glass h-9 px-3 rounded-pill inline-flex items-center gap-1.5 font-sans text-small text-ink-700 font-medium shadow-xs tabular-nums select-none border border-glass-border',
        className,
      )}
      aria-label={ariaLabel}
      data-testid="topbar-live-clock"
    >
      <Clock className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden="true" />
      <span>{displayTime}</span>
    </time>
  );
};

export default TopBarClock;
