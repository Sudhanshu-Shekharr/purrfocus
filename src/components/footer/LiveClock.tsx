import React, { useState, useEffect } from 'react';
import { usePrefsStore } from '@/features/prefs/store';
import type { ClockFormat } from '@/features/prefs/types';

export interface LiveClockProps {
  className?: string;
  format?: ClockFormat;
}

export function formatTime(date: Date, format: ClockFormat = 'auto'): string {
  try {
    const hour12 = format === '12h' ? true : format === '24h' ? false : undefined;
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12,
    }).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}

/**
 * Isolated live clock component updating every second.
 * Living in its own component guarantees that parent page/shell
 * components do not re-render on each tick.
 */
export const LiveClock: React.FC<LiveClockProps> = ({
  className = '',
  format: propFormat,
}) => {
  const prefFormat = usePrefsStore(state => state.clockFormat);
  const effectiveFormat = propFormat ?? prefFormat;

  const [timeStr, setTimeStr] = useState<string>(() =>
    formatTime(new Date(), effectiveFormat),
  );

  useEffect(() => {
    const update = () => {
      setTimeStr(formatTime(new Date(), effectiveFormat));
    };

    update();

    // Calculate delay until next exact second to stay perfectly synchronized
    const now = Date.now();
    const delay = 1000 - (now % 1000);

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timeoutId = setTimeout(() => {
      update();
      intervalId = setInterval(update, 1000);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [effectiveFormat]);

  return (
    <span
      className={`tabular-nums font-sans ${className}`}
      aria-label={`Current time: ${timeStr}`}
      data-testid="live-clock"
    >
      {timeStr}
    </span>
  );
};

export default LiveClock;
