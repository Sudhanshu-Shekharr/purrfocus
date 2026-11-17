import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GlassCard, Eyebrow } from '@/components/ui';
import { CalendarRange } from 'lucide-react';
import { useStatsStore } from '@/features/stats/store';
import { minutesByDay } from '@/features/stats/selectors';
import { buildHeatmapGrid, type HeatmapCell } from './deskUtils';
import { cn } from '@/lib/cn';

const BUCKET_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-ink-900/[0.05] border border-glass-border/50',
  1: 'bg-accent/30 border border-accent/20',
  2: 'bg-accent/55 border border-accent/30',
  3: 'bg-accent/80 border border-accent/40',
  4: 'bg-accent border border-accent-soft shadow-xs',
};

const BUCKET_LABELS = [
  '0 min',
  '1–24 min',
  '25–49 min',
  '50–99 min',
  '100+ min',
];

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HeatmapCalendar: React.FC = () => {
  const logs = useStatsStore(state => state.logs);

  // Retrieve daily minutes for the last 182 days (26 weeks)
  const dailyMap = useMemo(() => minutesByDay(logs, 182), [logs]);
  const grid = useMemo(() => buildHeatmapGrid(dailyMap), [dailyMap]);

  // Roving focus tracking: { col, row }
  const [focusedCoord, setFocusedCoord] = useState<{ col: number; row: number }>({
    col: 25,
    row: 6,
  });

  const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Focus the active DOM element when keyboard navigating
  useEffect(() => {
    const key = `${focusedCoord.col}-${focusedCoord.row}`;
    const el = cellRefs.current.get(key);
    if (el && document.activeElement && el.parentElement?.parentElement?.contains(document.activeElement)) {
      el.focus();
    }
  }, [focusedCoord]);

  const handleKeyDown = (e: React.KeyboardEvent, col: number, row: number) => {
    let nextCol = col;
    let nextRow = row;
    let handled = false;

    switch (e.key) {
      case 'ArrowUp':
        nextRow = Math.max(0, row - 1);
        handled = true;
        break;
      case 'ArrowDown':
        nextRow = Math.min(6, row + 1);
        handled = true;
        break;
      case 'ArrowLeft':
        nextCol = Math.max(0, col - 1);
        handled = true;
        break;
      case 'ArrowRight':
        nextCol = Math.min(25, col + 1);
        handled = true;
        break;
      case 'Home':
        nextCol = 0;
        handled = true;
        break;
      case 'End':
        nextCol = 25;
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      setFocusedCoord({ col: nextCol, row: nextRow });
      const nextKey = `${nextCol}-${nextRow}`;
      cellRefs.current.get(nextKey)?.focus();
    }
  };

  return (
    <GlassCard className="p-4 sm:p-6 w-full" role="region" aria-label="Focus activity heatmap calendar">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Eyebrow className="text-ink-600">CONSISTENCY</Eyebrow>
          <h2 className="font-serif text-lg text-ink-900 mt-0.5 font-medium">Activity Heatmap (Last 26 Weeks)</h2>
        </div>
        <div className="p-1.5 rounded-pill glass text-accent" aria-hidden="true">
          <CalendarRange className="h-4 w-4" />
        </div>
      </div>

      {/* Grid container with horizontal scroll on small screens */}
      <div className="overflow-x-auto pb-2 focus:outline-none" tabIndex={-1}>
        <div
          role="grid"
          aria-label="Activity calendar, 26 weeks columns by 7 weekday rows. Use arrow keys to navigate."
          className="flex gap-1.5 min-w-[560px] select-none py-1"
        >
          {/* Weekday Row Labels (Mon, Wed, Fri) */}
          <div className="flex flex-col justify-between py-0.5 text-micro font-sans text-ink-500 pr-1.5" aria-hidden="true">
            {WEEKDAY_NAMES.map((name, i) => (
              <span key={name} className="h-3.5 flex items-center leading-none">
                {i % 2 === 0 ? name : ''}
              </span>
            ))}
          </div>

          {/* 26 Week Columns */}
          {grid.map((week, colIndex) => (
            <div
              key={`week-${colIndex}`}
              role="row"
              aria-label={`Week ${colIndex + 1}`}
              className="flex flex-col gap-1.5"
            >
              {week.map((cell: HeatmapCell) => {
                const isFocused =
                  focusedCoord.col === cell.col && focusedCoord.row === cell.row;
                const cellKey = `${cell.col}-${cell.row}`;

                return (
                  <button
                    key={cell.date}
                    ref={el => {
                      if (el) cellRefs.current.set(cellKey, el);
                      else cellRefs.current.delete(cellKey);
                    }}
                    type="button"
                    role="gridcell"
                    tabIndex={isFocused ? 0 : -1}
                    aria-label={`${cell.date}: ${cell.minutes} minutes of focus`}
                    aria-selected={isFocused}
                    onClick={() => setFocusedCoord({ col: cell.col, row: cell.row })}
                    onKeyDown={e => handleKeyDown(e, cell.col, cell.row)}
                    className={cn(
                      'w-3.5 h-3.5 rounded-[3px] transition-transform duration-75',
                      BUCKET_COLORS[cell.bucket],
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent hover:scale-125 focus:scale-125 z-base',
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-micro text-ink-600 mt-3 pt-3 border-t border-glass-border/40 font-sans">
        <span className="text-ink-500">Arrow keys navigate between days</span>
        <div className="flex items-center gap-1.5" aria-label="Heatmap activity scale legend">
          <span className="text-ink-500">Less</span>
          {([0, 1, 2, 3, 4] as const).map(bucket => (
            <span
              key={bucket}
              title={BUCKET_LABELS[bucket]}
              className={cn('w-3 h-3 rounded-[2px]', BUCKET_COLORS[bucket])}
            />
          ))}
          <span className="text-ink-500">More</span>
        </div>
      </div>
    </GlassCard>
  );
};
