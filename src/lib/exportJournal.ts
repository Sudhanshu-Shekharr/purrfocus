import type { SessionLog } from '@/features/stats/types';
import { getCatCommentForSession } from './catCommentPicker';
import { getTodayDateString } from '@/features/timer/constants';

const MOOD_EMOJIS: Record<number, string> = {
  1: '😴',
  2: '😐',
  3: '🙂',
  4: '😊',
  5: '🌟',
};

/**
 * Escapes characters that have markdown syntax meaning in user notes.
 */
export function escapeMarkdown(str: string): string {
  return str.replace(/([\\`*_{}[\]()#+\-.!<>|])/g, '\\$1');
}

/**
 * Sanitizes a string for CSV to prevent formula injection attacks (CSV injection / DDE).
 * If a cell begins with '=', '+', '-', '@', '\t', or '\r', it prefixes it with a single quote.
 */
export function sanitizeForCsv(val: string): string {
  if (!val) return '';
  const firstChar = val.charAt(0);
  if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || firstChar === '\t' || firstChar === '\r') {
    return `'${val}`;
  }
  return val;
}

/**
 * RFC 4180 compliant CSV field formatting.
 * Quotes all strings, replaces internal quotes with double quotes.
 */
export function formatCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  const sanitized = sanitizeForCsv(str);
  const escaped = sanitized.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Generates formatted Markdown string grouped chronologically by local date.
 */
export function generateJournalMarkdown(logs: SessionLog[]): string {
  const totalMinutes = logs.reduce((sum, l) => sum + l.minutes, 0);
  const totalSessions = logs.length;

  let md = `# Purrfocus Study Journal\n\n`;
  md += `Exported on ${new Date().toLocaleDateString(undefined, {
    dateStyle: 'long',
  })} · ${totalSessions} sessions · ${totalMinutes} focus minutes.\n\n`;

  if (logs.length === 0) {
    md += `*No sessions recorded yet.*\n`;
    return md;
  }

  // Group by date (logs are assumed newest-first or sorted)
  const grouped = new Map<string, SessionLog[]>();
  for (const log of logs) {
    const list = grouped.get(log.date) ?? [];
    list.push(log);
    grouped.set(log.date, list);
  }

  for (const [date, sessionList] of grouped.entries()) {
    md += `## ${date}\n\n`;
    for (const session of sessionList) {
      const timeStr = session.completedAt
        ? new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Session';
      const subject = session.subject ? escapeMarkdown(session.subject) : 'Untagged';
      const moodEmoji = session.mood ? MOOD_EMOJIS[session.mood] : null;
      const moodStr = moodEmoji ? `${moodEmoji} (${session.mood}/5)` : 'Unset';
      const catComment = getCatCommentForSession(session.sessionId, session.mood);

      md += `- **${timeStr}**: ${session.minutes}m · *${subject}*\n`;
      md += `  - **Mood:** ${moodStr}\n`;
      if (session.note) {
        md += `  - **Note:** ${escapeMarkdown(session.note)}\n`;
      }
      md += `  - **Cat:** *"${escapeMarkdown(catComment)}"* \n`;
    }
    md += `\n`;
  }

  return md;
}

/**
 * Generates RFC 4180 CSV string for all sessions.
 */
export function generateJournalCsv(logs: SessionLog[]): string {
  const headers = [
    'Session ID',
    'Date',
    'Completed At',
    'Minutes',
    'Subject',
    'Mood',
    'Note',
    'Cat Comment',
    'Source',
  ];

  const lines: string[] = [headers.map(formatCsvCell).join(',')];

  for (const log of logs) {
    const timeStr = log.completedAt ? new Date(log.completedAt).toISOString() : '';
    const subject = log.subject ?? 'Untagged';
    const mood = log.mood ? `${log.mood} (${MOOD_EMOJIS[log.mood] ?? ''})` : '';
    const note = log.note ?? '';
    const catComment = getCatCommentForSession(log.sessionId, log.mood);

    const row = [
      formatCsvCell(log.sessionId),
      formatCsvCell(log.date),
      formatCsvCell(timeStr),
      formatCsvCell(log.minutes),
      formatCsvCell(subject),
      formatCsvCell(mood),
      formatCsvCell(note),
      formatCsvCell(catComment),
      formatCsvCell(log.source),
    ];

    lines.push(row.join(','));
  }

  return lines.join('\r\n');
}

/**
 * Triggers a browser download of the Markdown file.
 */
export function downloadJournalMarkdown(logs: SessionLog[], filename?: string): void {
  const content = generateJournalMarkdown(logs);
  const name = filename ?? `purrfocus-journal-${getTodayDateString()}.md`;
  triggerDownload(content, name, 'text/markdown;charset=utf-8');
}

/**
 * Triggers a browser download of the CSV file.
 */
export function downloadJournalCsv(logs: SessionLog[], filename?: string): void {
  const content = generateJournalCsv(logs);
  const name = filename ?? `purrfocus-journal-${getTodayDateString()}.csv`;
  triggerDownload(content, name, 'text/csv;charset=utf-8');
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
