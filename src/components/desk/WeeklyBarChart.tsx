import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { GlassCard, Eyebrow } from '@/components/ui';
import { BarChart3 } from 'lucide-react';
import { useStatsStore } from '@/features/stats/store';
import { minutesByDay } from '@/features/stats/selectors';
import { getTodayDateString } from '@/features/timer/constants';

export const WeeklyBarChart: React.FC = () => {
  const logs = useStatsStore(state => state.logs);
  const shouldReduceMotion = useReducedMotion();

  // 7 days ending today
  const dailyMinutesMap = minutesByDay(logs, 7);
  const dateKeys = Object.keys(dailyMinutesMap);

  const entries = dateKeys.map(dateStr => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y!, m! - 1, d!);
    const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
    const isToday = dateStr === getTodayDateString();
    return {
      date: dateStr,
      dayName,
      minutes: dailyMinutesMap[dateStr] ?? 0,
      isToday,
    };
  });

  const maxMinutes = Math.max(60, ...entries.map(e => e.minutes));

  // Chart dimensions inside SVG viewBox (0 0 320 150)
  const chartHeight = 100;
  const barWidth = 26;
  const startX = 20;
  const gap = (320 - startX * 2 - barWidth * 7) / 6;

  return (
    <GlassCard className="p-4 sm:p-6 flex flex-col justify-between" role="region" aria-label="Weekly focus minutes chart">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Eyebrow className="text-ink-600">LAST 7 DAYS</Eyebrow>
          <h2 className="font-serif text-lg text-ink-900 mt-0.5 font-medium">Daily Focus</h2>
        </div>
        <div className="p-1.5 rounded-pill glass text-accent" aria-hidden="true">
          <BarChart3 className="h-4 w-4" />
        </div>
      </div>

      {/* Hand-rolled accessible SVG Bar Chart */}
      <div className="w-full relative">
        <svg
          viewBox="0 0 320 150"
          className="w-full h-auto overflow-visible select-none"
          aria-hidden="true"
        >
          {/* Subtle horizontal grid lines */}
          <line x1={startX} y1={20} x2={320 - startX} y2={20} stroke="currentColor" className="text-glass-border" strokeDasharray="3 3" />
          <line x1={startX} y1={20 + chartHeight / 2} x2={320 - startX} y2={20 + chartHeight / 2} stroke="currentColor" className="text-glass-border" strokeDasharray="3 3" />
          <line x1={startX} y1={20 + chartHeight} x2={320 - startX} y2={20 + chartHeight} stroke="currentColor" className="text-glass-border" />

          {/* Max scale guide label */}
          <text x={startX} y={15} className="fill-ink-400 text-[9px] font-sans">
            {maxMinutes}m
          </text>

          {/* Bars and Day Labels */}
          {entries.map((entry, index) => {
            const x = startX + index * (barWidth + gap);
            const height = (entry.minutes / maxMinutes) * chartHeight;
            const barY = 20 + chartHeight - height;
            const hasData = entry.minutes > 0;

            return (
              <g key={entry.date}>
                <title>{`${entry.dayName} (${entry.date}): ${entry.minutes} min`}</title>

                {/* Background ghost track */}
                <rect
                  x={x}
                  y={20}
                  width={barWidth}
                  height={chartHeight}
                  rx={4}
                  className="fill-ink-900/[0.04]"
                />

                {/* Animated colored bar */}
                <motion.rect
                  x={x}
                  y={shouldReduceMotion ? barY : 20 + chartHeight}
                  width={barWidth}
                  height={shouldReduceMotion ? height : 0}
                  rx={4}
                  animate={{
                    y: barY,
                    height: height,
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.5, delay: index * 0.05, ease: 'easeOut' }
                  }
                  className={
                    hasData
                      ? entry.isToday
                        ? 'fill-accent'
                        : 'fill-accent-soft hover:fill-accent transition-colors'
                      : 'fill-transparent'
                  }
                />

                {/* Minute badge atop bar if space permits */}
                {hasData && (
                  <text
                    x={x + barWidth / 2}
                    y={Math.max(16, barY - 4)}
                    textAnchor="middle"
                    className="fill-ink-700 text-[10px] font-medium font-sans tabular-nums"
                  >
                    {entry.minutes}
                  </text>
                )}

                {/* Day label below baseline */}
                <text
                  x={x + barWidth / 2}
                  y={20 + chartHeight + 16}
                  textAnchor="middle"
                  className={`text-[11px] font-sans ${
                    entry.isToday ? 'fill-accent font-semibold' : 'fill-ink-600 font-medium'
                  }`}
                >
                  {entry.dayName}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Visually hidden accessible data table matching the chart numbers */}
        <table className="sr-only">
          <caption>Weekly focus breakdown</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Day</th>
              <th scope="col">Minutes</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.date}>
                <td>{e.date}</td>
                <td>{e.dayName}</td>
                <td>{e.minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};
