import React, { useState, useMemo } from 'react';
import { GlassCard, Eyebrow, SegmentedTabs } from '@/components/ui';
import { PieChart } from 'lucide-react';
import { useStatsStore } from '@/features/stats/store';
import { minutesBySubject } from '@/features/stats/selectors';
import { groupSubjects, type SubjectSlice } from './deskUtils';

type RangeOption = 'today' | 'week' | 'all';

const DONUT_COLORS = [
  '#C97A63', // Accent terracotta
  '#5E8B7E', // Sage green
  '#D4A373', // Warm ochre
  '#6B7B8E', // Slate blue
  '#9C6644', // Cocoa
  '#A0AEC0', // Soft neutral for "Other"
];

export const SubjectDonut: React.FC = () => {
  const logs = useStatsStore(state => state.logs);
  const [range, setRange] = useState<RangeOption>('week');

  const rawMap = useMemo(() => minutesBySubject(logs, range), [logs, range]);
  const slices = useMemo(() => groupSubjects(rawMap), [rawMap]);

  const totalMinutes = useMemo(
    () => slices.reduce((acc, s) => acc + s.minutes, 0),
    [slices],
  );

  // SVG Donut geometry
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <GlassCard className="p-4 sm:p-6 flex flex-col justify-between" role="region" aria-label="Subject focus breakdown">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <Eyebrow className="text-ink-600">DISTRIBUTION</Eyebrow>
          <h2 className="font-serif text-lg text-ink-900 mt-0.5 font-medium">Focus by Subject</h2>
        </div>

        {/* Range Segmented Control */}
        <SegmentedTabs<RangeOption>
          value={range}
          onChange={setRange}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'Week' },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>

      {/* Donut and Legend row */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
        {/* Hand-rolled SVG Donut */}
        <div className="relative flex items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 select-none overflow-visible"
            aria-hidden="true"
          >
            {/* Background track circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-ink-900/[0.05] fill-none"
            />

            {/* Slices */}
            {totalMinutes > 0 &&
              slices.map((slice, i) => {
                const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                cumulativePercent += slice.percentage;
                const color = DONUT_COLORS[i % DONUT_COLORS.length]!;

                return (
                  <circle
                    key={slice.subject}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="fill-none transition-all duration-300"
                  >
                    <title>{`${slice.subject}: ${slice.minutes}m (${slice.percentage}%)`}</title>
                  </circle>
                );
              })}
          </svg>

          {/* Donut Center Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-serif font-medium text-ink-900 tabular-nums">
              {totalMinutes}
            </span>
            <span className="text-micro text-ink-500 font-sans uppercase tracking-wider">
              minutes
            </span>
          </div>
        </div>

        {/* Visual Swatch Legend */}
        <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[140px]">
          {slices.length === 0 ? (
            <p className="text-small text-ink-500 italic">No subject minutes recorded.</p>
          ) : (
            slices.map((slice: SubjectSlice, i: number) => (
              <div
                key={slice.subject}
                className="flex items-center justify-between gap-3 text-small font-sans"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span className="text-ink-900 font-medium truncate max-w-[120px]" title={slice.subject}>
                    {slice.subject}
                  </span>
                </div>
                <span className="text-ink-500 tabular-nums shrink-0">
                  {slice.minutes}m ({slice.percentage}%)
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Plain table with the same data, always visible for screen readers and copying */}
      <div className="mt-4 pt-4 border-t border-glass-border/40">
        <div className="flex items-center justify-between mb-2">
          <Eyebrow className="text-ink-500">SUBJECT BREAKDOWN DATA</Eyebrow>
          <span className="p-1 rounded-pill glass text-accent" aria-hidden="true">
            <PieChart className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-small border-collapse">
            <caption className="sr-only">Detailed breakdown of focus time by subject</caption>
            <thead>
              <tr className="border-b border-glass-border/60 text-ink-600 text-micro uppercase tracking-wider">
                <th scope="col" className="py-2 pr-4 font-medium">Subject</th>
                <th scope="col" className="py-2 px-4 font-medium text-right">Minutes</th>
                <th scope="col" className="py-2 pl-4 font-medium text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border/30 text-ink-800">
              {slices.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-3 text-center text-ink-500 italic">
                    No focus logged for this period.
                  </td>
                </tr>
              ) : (
                slices.map(slice => (
                  <tr key={slice.subject} className="hover:bg-ink-900/[0.02]">
                    <td className="py-2 pr-4 font-medium text-ink-900">{slice.subject}</td>
                    <td className="py-2 px-4 text-right tabular-nums text-ink-700">{slice.minutes} min</td>
                    <td className="py-2 pl-4 text-right tabular-nums text-ink-500">{slice.percentage}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </GlassCard>
  );
};
