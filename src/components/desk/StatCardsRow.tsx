import React from 'react';
import { GlassCard, Eyebrow } from '@/components/ui';
import { Clock, Calendar, Trophy, Flame } from 'lucide-react';
import { useStatsStore } from '@/features/stats/store';
import { totalsFor, currentStreak } from '@/features/stats/selectors';
import { useCatStore } from '@/features/cat/store';
import { getBondLevel, getBondLevelLabel } from '@/features/cat/bond';

export const StatCardsRow: React.FC = () => {
  const logs = useStatsStore(state => state.logs);
  const bondPoints = useCatStore(state => state.bond);

  const today = totalsFor(logs, 'today');
  const week = totalsFor(logs, 'week');
  const allTime = totalsFor(logs, 'all');
  const streak = currentStreak(logs);
  const bondLevel = getBondLevel(bondPoints);
  const bondLabel = getBondLevelLabel(bondLevel);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full" data-testid="desk-stats-row">
      {/* 1. Today */}
      <GlassCard className="p-4 sm:p-5 flex flex-col justify-between" role="region" aria-label="Today focus stats">
        <div className="flex items-center justify-between text-ink-500 mb-2">
          <Eyebrow className="text-ink-600">TODAY</Eyebrow>
          <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-serif font-medium text-ink-900 tabular-nums">
            {today.minutes} <span className="text-sm font-sans text-ink-500 font-normal">min</span>
          </div>
          <p className="text-micro sm:text-small text-ink-500 mt-1 tabular-nums">
            {today.sessions} {today.sessions === 1 ? 'session' : 'sessions'}
          </p>
        </div>
      </GlassCard>

      {/* 2. This week */}
      <GlassCard className="p-4 sm:p-5 flex flex-col justify-between" role="region" aria-label="This week focus stats">
        <div className="flex items-center justify-between text-ink-500 mb-2">
          <Eyebrow className="text-ink-600">THIS WEEK</Eyebrow>
          <Calendar className="h-4 w-4 text-accent" aria-hidden="true" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-serif font-medium text-ink-900 tabular-nums">
            {week.minutes} <span className="text-sm font-sans text-ink-500 font-normal">min</span>
          </div>
          <p className="text-micro sm:text-small text-ink-500 mt-1 tabular-nums">
            {week.sessions} {week.sessions === 1 ? 'session' : 'sessions'}
          </p>
        </div>
      </GlassCard>

      {/* 3. All time */}
      <GlassCard className="p-4 sm:p-5 flex flex-col justify-between" role="region" aria-label="All time focus stats">
        <div className="flex items-center justify-between text-ink-500 mb-2">
          <Eyebrow className="text-ink-600">ALL TIME</Eyebrow>
          <Trophy className="h-4 w-4 text-accent" aria-hidden="true" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-serif font-medium text-ink-900 tabular-nums">
            {allTime.minutes.toLocaleString()} <span className="text-sm font-sans text-ink-500 font-normal">min</span>
          </div>
          <p className="text-micro sm:text-small text-ink-500 mt-1 tabular-nums">
            {allTime.sessions} {allTime.sessions === 1 ? 'session' : 'sessions'}
          </p>
        </div>
      </GlassCard>

      {/* 4. Streak & Bond */}
      <GlassCard className="p-4 sm:p-5 flex flex-col justify-between" role="region" aria-label="Current streak and companion bond">
        <div className="flex items-center justify-between text-ink-500 mb-2">
          <Eyebrow className="text-ink-600">STREAK &amp; BOND</Eyebrow>
          <Flame className="h-4 w-4 text-warning" aria-hidden="true" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-serif font-medium text-ink-900 tabular-nums">
            {streak.current} <span className="text-sm font-sans text-ink-500 font-normal">{streak.current === 1 ? 'day' : 'days'}</span>
          </div>
          <p className="text-micro sm:text-small text-ink-700 mt-1 font-medium flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent inline-block" aria-hidden="true" />
            <span>{bondLabel}</span>
          </p>
        </div>
      </GlassCard>
    </div>
  );
};
