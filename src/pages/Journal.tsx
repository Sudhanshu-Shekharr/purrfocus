import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Filter, BookOpen } from 'lucide-react';
import { PillButton } from '@/components/ui/PillButton';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { JournalEntry } from '@/components/journal/JournalEntry';
import { useStatsStore } from '@/features/stats/store';
import { sessionsForJournal } from '@/features/stats/selectors';
import { downloadJournalMarkdown, downloadJournalCsv } from '@/lib/exportJournal';
import { getTodayDateString } from '@/features/timer/constants';
import type { SessionLog } from '@/features/stats/types';

type TimeRangeFilter = 'all' | 'week';

const RANGE_OPTIONS: readonly SegmentedOption<TimeRangeFilter>[] = [
  { value: 'all', label: 'All time' },
  { value: 'week', label: 'Last 7 days' },
];

function formatDateHeader(dateStr: string): string {
  const today = getTodayDateString();
  const d = new Date(dateStr + 'T12:00:00');

  if (dateStr === today) {
    return `Today · ${d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`;
  }

  // Check yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  if (dateStr === yStr) {
    return `Yesterday · ${d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`;
  }

  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export const JournalPage: React.FC = () => {
  const logs = useStatsStore(s => s.logs);

  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [visibleLimit, setVisibleLimit] = useState<number>(50);

  // Extract distinct subjects from logs
  const distinctSubjects = useMemo(() => {
    const set = new Set<string>();
    for (const log of logs) {
      if (log.subject) {
        set.add(log.subject);
      }
    }
    return Array.from(set).sort();
  }, [logs]);

  // Apply selectors
  const filteredSessions = useMemo(() => {
    const subjectFilter =
      selectedSubject === 'all'
        ? undefined
        : selectedSubject === 'untagged'
          ? null
          : selectedSubject;

    return sessionsForJournal(logs, {
      weekOnly: timeRange === 'week',
      subject: subjectFilter,
    });
  }, [logs, timeRange, selectedSubject]);

  // Visible sessions capped for pagination
  const visibleSessions = useMemo(() => {
    return filteredSessions.slice(0, visibleLimit);
  }, [filteredSessions, visibleLimit]);

  // Group visible sessions by date
  const groupedByDate = useMemo(() => {
    const map = new Map<string, SessionLog[]>();
    for (const session of visibleSessions) {
      const list = map.get(session.date) ?? [];
      list.push(session);
      map.set(session.date, list);
    }
    return map;
  }, [visibleSessions]);

  const handleExportMarkdown = () => {
    downloadJournalMarkdown(filteredSessions);
  };

  const handleExportCsv = () => {
    downloadJournalCsv(filteredSessions);
  };

  return (
    <div className="flex-1 max-w-[960px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-small font-sans text-ink-700 hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-pill px-2.5 py-1 -ml-2.5"
        >
          <span>←</span>
          <span>Back to my desk</span>
        </Link>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <PillButton
            variant="glass"
            size="sm"
            leftIcon={<FileText className="h-3.5 w-3.5 text-accent" />}
            onClick={handleExportMarkdown}
            aria-label="Export journal as Markdown"
            disabled={filteredSessions.length === 0}
          >
            Export .md
          </PillButton>
          <PillButton
            variant="glass"
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5 text-accent" />}
            onClick={handleExportCsv}
            aria-label="Export journal as CSV"
            disabled={filteredSessions.length === 0}
          >
            Export .csv
          </PillButton>
        </div>
      </div>

      {/* Page Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl sm:text-4xl text-ink-900 tracking-tight font-medium">
          My Journal
        </h1>
        <p className="font-sans text-ink-700 text-small sm:text-body">
          A quiet timeline of your study sessions, mood reflections, and notes.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-card bg-glass border border-glass-border">
        {/* Time range tabs */}
        <div className="w-full sm:w-auto">
          <SegmentedTabs<TimeRangeFilter>
            value={timeRange}
            onChange={setTimeRange}
            options={RANGE_OPTIONS}
          />
        </div>

        {/* Subject filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label htmlFor="subject-filter-select" className="sr-only">
            Filter by subject
          </label>
          <div className="inline-flex items-center gap-2 text-ink-700 font-sans text-small">
            <Filter className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>Subject:</span>
          </div>
          <select
            id="subject-filter-select"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="rounded-pill border border-glass-border bg-glass px-3 py-1 font-sans text-small text-ink-900 shadow-glass focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <option value="all" className="bg-canvas text-ink-900">
              All subjects
            </option>
            <option value="untagged" className="bg-canvas text-ink-900">
              Untagged
            </option>
            {distinctSubjects.map(sub => (
              <option key={sub} value={sub} className="bg-canvas text-ink-900">
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Timeline List */}
      {filteredSessions.length === 0 ? (
        <div className="glass-panel rounded-card border border-glass-border p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-3 rounded-full bg-accent/10 text-accent">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-title text-ink-900">No journal entries yet</h2>
          <p className="font-sans text-ink-700 text-small max-w-sm">
            {logs.length === 0
              ? 'Complete a focus session to begin your timeline. Your reflections and cat comments will gather here.'
              : 'No sessions match your selected filters. Try switching back to all subjects or all time.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(groupedByDate.entries()).map(([dateStr, sessionGroup]) => (
            <section key={dateStr} className="flex flex-col gap-3">
              <h2 className="font-serif text-subheading text-ink-900 border-b border-glass-border pb-1.5 flex items-center gap-2">
                <span>{formatDateHeader(dateStr)}</span>
                <span className="text-micro font-sans font-normal text-ink-500 tabular-nums">
                  ({sessionGroup.reduce((s, g) => s + g.minutes, 0)}m total)
                </span>
              </h2>

              <div className="flex flex-col gap-3">
                {sessionGroup.map(session => (
                  <JournalEntry key={session.sessionId} session={session} />
                ))}
              </div>
            </section>
          ))}

          {/* Pagination: Show more button */}
          {visibleLimit < filteredSessions.length && (
            <div className="flex flex-col items-center gap-2 pt-4">
              <PillButton
                variant="glass"
                size="md"
                onClick={() => setVisibleLimit(c => c + 50)}
              >
                Show more sessions
              </PillButton>
              <span className="font-sans text-micro text-ink-500 tabular-nums">
                Showing {visibleLimit} of {filteredSessions.length} sessions
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalPage;
