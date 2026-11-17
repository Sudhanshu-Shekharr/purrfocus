import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { LiveClock } from '@/components/footer/LiveClock';
import { useStatsStore, selectTodayMinutes } from '@/features/stats/store';
import { getTodayDateString } from '@/features/timer/constants';
import { useTimerStore } from '@/features/timer/store';

export function useTodayKey(): string {
  const [todayKey, setTodayKey] = useState<string>(() => getTodayDateString());

  useEffect(() => {
    const checkDate = () => {
      const current = getTodayDateString();
      setTodayKey(prev => {
        if (prev !== current) {
          useTimerStore.getState().rollDay(current);
          return current;
        }
        return prev;
      });
    };

    const interval = setInterval(checkDate, 30000);
    return () => clearInterval(interval);
  }, []);

  return todayKey;
}

export const FooterStrip: React.FC = () => {
  const todayKey = useTodayKey();
  const selectToday = useCallback(
    (state: ReturnType<typeof useStatsStore.getState>) =>
      selectTodayMinutes(state, todayKey),
    [todayKey],
  );
  const todayMinutes = useStatsStore(selectToday);

  return (
    <footer className="w-full pt-6 pb-8 border-t border-glass-border/30 text-ink-700 font-sans text-small transition-colors">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        {/* Left: Cozy quote */}
        <div className="flex items-center gap-1.5 text-ink-500">
          <Heart className="h-3.5 w-3.5 text-accent/80 shrink-0" />
          <span>Made for slow mornings & small victories.</span>
        </div>

        {/* Right: Stats ticker, isolated LiveClock, and Journal link */}
        <div className="flex items-center flex-wrap justify-center gap-3 text-ink-700">
          <span>{todayMinutes} min of focus today</span>
          <span className="text-glass-border" aria-hidden="true">
            ·
          </span>
          <div className="glass px-2.5 py-0.5 rounded-pill border border-glass-border shadow-xs flex items-center gap-1.5 text-ink-900 font-medium text-small">
            <span className="h-1.5 w-1.5 rounded-full bg-accent motion-safe:animate-pulse" />
            <LiveClock />
          </div>
          <span className="text-glass-border" aria-hidden="true">
            ·
          </span>
          <Link
            to="/journal"
            className="text-ink-700 hover:text-accent font-medium transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent rounded"
          >
            My journal ↗
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default FooterStrip;
