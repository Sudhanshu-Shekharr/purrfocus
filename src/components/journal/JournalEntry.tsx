import React from 'react';
import { MessageCircle, Tag } from 'lucide-react';
import type { SessionLog } from '@/features/stats/types';
import { getCatCommentForSession } from '@/lib/catCommentPicker';
import { usePrefsStore } from '@/features/prefs/store';
import { cn } from '@/lib/cn';

export type JournalEntryProps = {
  session: SessionLog;
  className?: string;
};

const MOOD_META: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😴', label: 'Tired' },
  2: { emoji: '😐', label: 'Okay' },
  3: { emoji: '🙂', label: 'Good' },
  4: { emoji: '😊', label: 'Great' },
  5: { emoji: '🌟', label: 'Energized' },
};

export const JournalEntry: React.FC<JournalEntryProps> = ({ session, className }) => {
  const clockFormat = usePrefsStore(s => s.clockFormat);
  const hour12 = clockFormat === '12h' ? true : clockFormat === '24h' ? false : undefined;

  const timeString = session.completedAt
    ? new Date(session.completedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12,
      })
    : '';

  const mood = session.mood ? MOOD_META[session.mood] : null;
  const catComment = getCatCommentForSession(session.sessionId, session.mood);

  return (
    <article
      className={cn(
        'glass-panel rounded-card border border-glass-border p-4 sm:p-5 flex flex-col gap-3 transition-all',
        'hover:border-accent/40 shadow-glass',
        className,
      )}
      aria-label={`Session at ${timeString || session.date}, ${session.minutes} minutes`}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {timeString && (
            <span className="font-sans text-small font-medium text-ink-900 tabular-nums">
              {timeString}
            </span>
          )}
          <span className="text-ink-500 font-sans text-micro">·</span>
          <span className="font-sans text-small font-semibold text-accent tabular-nums">
            {session.minutes} min
          </span>
          <span className="text-ink-500 font-sans text-micro">·</span>
          <span className="inline-flex items-center gap-1 rounded-pill bg-glass px-2.5 py-0.5 font-sans text-micro text-ink-700 border border-glass-border">
            <Tag className="h-3 w-3 text-ink-500" aria-hidden="true" />
            <span>{session.subject ?? 'Untagged'}</span>
          </span>
        </div>

        {/* Mood Badge */}
        {mood && (
          <span
            className="inline-flex items-center gap-1.5 rounded-pill bg-accent/10 px-2.5 py-0.5 font-sans text-micro font-medium text-ink-900 border border-accent/20"
            title={`Mood: ${mood.label}`}
          >
            <span role="img" aria-hidden="true">
              {mood.emoji}
            </span>
            <span>{mood.label}</span>
          </span>
        )}
      </div>

      {/* User Note */}
      {session.note && (
        <p className="font-sans text-body text-ink-900 bg-glass/60 rounded-btn px-3 py-2 border border-glass-border italic leading-relaxed">
          &ldquo;{session.note}&rdquo;
        </p>
      )}

      {/* Cat Companion Reflection */}
      <div className="flex items-start gap-2 pt-1 text-ink-700">
        <MessageCircle className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" aria-hidden="true" />
        <p className="font-sans text-small text-ink-700 italic">
          &ldquo;{catComment}&rdquo;
        </p>
      </div>
    </article>
  );
};
