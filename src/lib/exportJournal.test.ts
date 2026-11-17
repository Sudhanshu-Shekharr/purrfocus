import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  escapeMarkdown,
  sanitizeForCsv,
  formatCsvCell,
  generateJournalMarkdown,
  generateJournalCsv,
  downloadJournalMarkdown,
  downloadJournalCsv,
} from './exportJournal';
import type { SessionLog } from '@/features/stats/types';

describe('exportJournal module', () => {
  const sampleLogs: SessionLog[] = [
    {
      sessionId: 'sess-1',
      date: '2026-11-16',
      completedAt: 1763286400000,
      minutes: 25,
      subject: 'Math & Stats',
      mood: 4,
      note: 'Solved 5 integrals! [link](https://test.com)',
      source: 'finish',
    },
    {
      sessionId: 'sess-2',
      date: '2026-11-16',
      completedAt: 1763282800000,
      minutes: 15,
      subject: null,
      mood: 1,
      note: '=cmd|’ /C calc’!A0', // malicious formula injection attempt
      source: 'finish',
    },
    {
      sessionId: 'sess-3',
      date: '2026-11-15',
      completedAt: 1763200000000,
      minutes: 50,
      subject: 'Biology',
      source: 'finish',
    },
  ];

  describe('escapeMarkdown', () => {
    it('escapes Markdown special characters in strings', () => {
      const input = 'Hello [world] *bold* _italic_ `code` <tag> & |';
      const escaped = escapeMarkdown(input);
      expect(escaped).toContain('\\[world\\]');
      expect(escaped).toContain('\\*bold\\*');
      expect(escaped).toContain('\\_italic\\_');
      expect(escaped).toContain('\\`code\\`');
      expect(escaped).toContain('\\<tag\\>');
      expect(escaped).toContain('\\|');
    });
  });

  describe('sanitizeForCsv', () => {
    it('prepends single quote to cells beginning with formula triggers', () => {
      expect(sanitizeForCsv('=1+1')).toBe("'=1+1");
      expect(sanitizeForCsv('+100')).toBe("'+100");
      expect(sanitizeForCsv('-50')).toBe("'-50");
      expect(sanitizeForCsv('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
      expect(sanitizeForCsv('\tmalicious')).toBe("'\tmalicious");
      expect(sanitizeForCsv('\rmalicious')).toBe("'\rmalicious");
    });

    it('leaves safe strings untouched', () => {
      expect(sanitizeForCsv('Normal study note')).toBe('Normal study note');
      expect(sanitizeForCsv('123')).toBe('123');
    });
  });

  describe('formatCsvCell', () => {
    it('wraps content in quotes and escapes internal quotes', () => {
      expect(formatCsvCell('Normal text')).toBe('"Normal text"');
      expect(formatCsvCell('Text with "quotes" inside')).toBe('"Text with ""quotes"" inside"');
      expect(formatCsvCell(null)).toBe('""');
      expect(formatCsvCell(undefined)).toBe('""');
      expect(formatCsvCell(25)).toBe('"25"');
    });

    it('sanitizes formula injection inside CSV cell', () => {
      expect(formatCsvCell('=SUM(1,2)')).toBe('"\'=SUM(1,2)"');
    });
  });

  describe('generateJournalMarkdown', () => {
    it('generates grouped markdown with headers and escaped notes', () => {
      const md = generateJournalMarkdown(sampleLogs);
      expect(md).toContain('# Purrfocus Study Journal');
      expect(md).toContain('## 2026-11-16');
      expect(md).toContain('## 2026-11-15');
      expect(md).toContain('Math & Stats');
      expect(md).toContain('Untagged');
      expect(md).toContain('\\[link\\]');
      expect(md).toContain('Cat:');
    });

    it('handles empty logs gracefully', () => {
      const md = generateJournalMarkdown([]);
      expect(md).toContain('*No sessions recorded yet.*');
    });
  });

  describe('generateJournalCsv', () => {
    it('generates valid RFC 4180 CSV with header row', () => {
      const csv = generateJournalCsv(sampleLogs);
      const lines = csv.split('\r\n');
      expect(lines.length).toBe(4); // Header + 3 sessions
      expect(lines[0]).toBe('"Session ID","Date","Completed At","Minutes","Subject","Mood","Note","Cat Comment","Source"');
      // Malicious formula cell is sanitized with leading single quote
      expect(lines[2]).toContain('"\'=cmd|’ /C calc’!A0"');
    });
  });

  describe('downloads', () => {
    beforeEach(() => {
      globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      globalThis.URL.revokeObjectURL = vi.fn();
    });

    it('downloadJournalMarkdown creates object URL and triggers download', () => {
      downloadJournalMarkdown(sampleLogs);
      expect(globalThis.URL.createObjectURL).toHaveBeenCalledTimes(1);
    });

    it('downloadJournalCsv creates object URL and triggers download', () => {
      downloadJournalCsv(sampleLogs);
      expect(globalThis.URL.createObjectURL).toHaveBeenCalledTimes(1);
    });
  });
});
