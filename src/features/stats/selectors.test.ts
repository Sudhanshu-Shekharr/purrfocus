import { describe, it, expect } from 'vitest';
import {
  totalsFor,
  minutesByDay,
  minutesBySubject,
  sessionsForJournal,
  currentStreak,
} from './selectors';
import type { SessionLog } from './types';

// Helper to build a SessionLog for tests
function makeLog(
  sessionId: string,
  date: string,
  minutes: number,
  opts: Partial<SessionLog> = {},
): SessionLog {
  return {
    sessionId,
    date,
    completedAt: new Date(date + 'T12:00:00').getTime(),
    minutes,
    subject: null,
    source: 'finish',
    ...opts,
  };
}

const TODAY = '2026-10-28';
const YESTERDAY = '2026-10-27';
const SIX_DAYS_AGO = '2026-10-22';
const EIGHT_DAYS_AGO = '2026-10-20';

describe('totalsFor', () => {
  it('today: session on today counts, session yesterday does not', () => {
    const logs = [makeLog('a', TODAY, 25), makeLog('b', YESTERDAY, 50)];
    const result = totalsFor(logs, 'today', TODAY);
    expect(result.minutes).toBe(25);
    expect(result.sessions).toBe(1);
  });

  it('week: session 6 days ago counts, session 8 days ago does not', () => {
    const logs = [
      makeLog('a', TODAY, 25),
      makeLog('b', SIX_DAYS_AGO, 30),
      makeLog('c', EIGHT_DAYS_AGO, 40),
    ];
    const result = totalsFor(logs, 'week', TODAY);
    expect(result.minutes).toBe(55); // 25 + 30
    expect(result.sessions).toBe(2);
  });

  it('all: all sessions count regardless of date', () => {
    const logs = [
      makeLog('a', TODAY, 25),
      makeLog('b', EIGHT_DAYS_AGO, 50),
      makeLog('c', '2024-01-01', 60),
    ];
    const result = totalsFor(logs, 'all', TODAY);
    expect(result.minutes).toBe(135);
    expect(result.sessions).toBe(3);
  });

  it('today: empty when no sessions today', () => {
    const logs = [makeLog('a', YESTERDAY, 25)];
    const result = totalsFor(logs, 'today', TODAY);
    expect(result.minutes).toBe(0);
    expect(result.sessions).toBe(0);
  });
});

describe('minutesByDay', () => {
  it('day with 0 minutes is present in result', () => {
    const logs = [makeLog('a', TODAY, 25)];
    const result = minutesByDay(logs, 7, TODAY);
    // TODAY should have 25 minutes; YESTERDAY should have 0
    expect(result[TODAY]).toBe(25);
    expect(result[YESTERDAY]).toBe(0);
    // All 7 days should be present
    expect(Object.keys(result)).toHaveLength(7);
  });

  it('correct bucketing across multiple days', () => {
    const logs = [
      makeLog('a', TODAY, 25),
      makeLog('b', TODAY, 10),
      makeLog('c', YESTERDAY, 30),
      makeLog('d', SIX_DAYS_AGO, 15),
    ];
    const result = minutesByDay(logs, 7, TODAY);
    expect(result[TODAY]).toBe(35);
    expect(result[YESTERDAY]).toBe(30);
    expect(result[SIX_DAYS_AGO]).toBe(15);
  });

  it('sessions outside the window are excluded', () => {
    const logs = [makeLog('a', EIGHT_DAYS_AGO, 60), makeLog('b', TODAY, 25)];
    const result = minutesByDay(logs, 7, TODAY);
    expect(result[TODAY]).toBe(25);
    // EIGHT_DAYS_AGO should not appear
    expect(result[EIGHT_DAYS_AGO]).toBeUndefined();
  });

  it('DST boundary: two sessions on different local dates appear in different buckets', () => {
    // Use dates that cross a typical DST boundary (spring forward in US: March 2026)
    // 2026-03-07 (before) and 2026-03-09 (after)
    const beforeDst = '2026-03-07';
    const afterDst = '2026-03-09';
    const refToday = afterDst;

    const logs = [
      makeLog('before', beforeDst, 25, {
        completedAt: new Date(beforeDst + 'T23:30:00').getTime(),
      }),
      makeLog('after', afterDst, 30, {
        completedAt: new Date(afterDst + 'T00:30:00').getTime(),
      }),
    ];

    const result = minutesByDay(logs, 3, refToday);
    expect(result[beforeDst]).toBe(25);
    expect(result[afterDst]).toBe(30);
  });
});

describe('minutesBySubject', () => {
  it('null subject maps to Untagged key', () => {
    const logs = [makeLog('a', TODAY, 25, { subject: null })];
    const result = minutesBySubject(logs, 'today', TODAY);
    expect(result['Untagged']).toBe(25);
  });

  it('groups sessions by subject correctly', () => {
    const logs = [
      makeLog('a', TODAY, 25, { subject: 'Math' }),
      makeLog('b', TODAY, 30, { subject: 'Math' }),
      makeLog('c', TODAY, 20, { subject: 'History' }),
      makeLog('d', TODAY, 15, { subject: null }),
    ];
    const result = minutesBySubject(logs, 'today', TODAY);
    expect(result['Math']).toBe(55);
    expect(result['History']).toBe(20);
    expect(result['Untagged']).toBe(15);
  });

  it('filters by range (today vs week)', () => {
    const logs = [
      makeLog('a', TODAY, 25, { subject: 'Math' }),
      makeLog('b', EIGHT_DAYS_AGO, 30, { subject: 'Math' }),
    ];

    const todayResult = minutesBySubject(logs, 'today', TODAY);
    expect(todayResult['Math']).toBe(25);

    const weekResult = minutesBySubject(logs, 'week', TODAY);
    expect(weekResult['Math']).toBe(25); // only today, 8 days ago is out of week

    const allResult = minutesBySubject(logs, 'all', TODAY);
    expect(allResult['Math']).toBe(55);
  });
});

describe('sessionsForJournal', () => {
  const logs: SessionLog[] = [
    makeLog('a', TODAY, 25, { completedAt: 1000, subject: 'Math' }),
    makeLog('b', TODAY, 30, { completedAt: 2000, subject: 'History' }),
    makeLog('c', YESTERDAY, 20, { completedAt: 500, subject: 'Math' }),
    makeLog('d', EIGHT_DAYS_AGO, 15, { completedAt: 100, subject: 'Math' }),
  ];

  it('weekOnly filter returns only last 7 days', () => {
    const result = sessionsForJournal(logs, { weekOnly: true }, TODAY);
    expect(result.map(l => l.sessionId)).not.toContain('d'); // 8 days ago
    expect(result).toHaveLength(3);
  });

  it('subject filter: exact match for string subject', () => {
    const result = sessionsForJournal(logs, { subject: 'Math' }, TODAY);
    expect(result.map(l => l.sessionId)).toEqual(
      expect.arrayContaining(['a', 'c', 'd']),
    );
    expect(result.map(l => l.sessionId)).not.toContain('b');
  });

  it('subject filter: null matches entries with null subject', () => {
    const logsWithNull: SessionLog[] = [
      makeLog('x', TODAY, 25, { subject: null, completedAt: 999 }),
      makeLog('y', TODAY, 30, { subject: 'Science', completedAt: 888 }),
    ];
    const result = sessionsForJournal(logsWithNull, { subject: null }, TODAY);
    expect(result).toHaveLength(1);
    expect(result[0]?.sessionId).toBe('x');
  });

  it('combined weekOnly + subject filter', () => {
    const result = sessionsForJournal(logs, { weekOnly: true, subject: 'Math' }, TODAY);
    // 'd' is 8 days ago so excluded
    expect(result.map(l => l.sessionId)).toContain('a');
    expect(result.map(l => l.sessionId)).toContain('c');
    expect(result.map(l => l.sessionId)).not.toContain('d');
    expect(result.map(l => l.sessionId)).not.toContain('b');
  });

  it('sorts newest first by completedAt descending', () => {
    const result = sessionsForJournal(logs, {}, TODAY);
    const completedAts = result.map(l => l.completedAt);
    expect(completedAts).toEqual([...completedAts].sort((a, b) => b - a));
  });
});

describe('currentStreak', () => {
  it('delegates to calculateStreak and returns correct StreakResult', () => {
    const logs: SessionLog[] = [
      makeLog('a', TODAY, 25),
      makeLog('b', YESTERDAY, 25),
    ];
    const result = currentStreak(logs, TODAY);
    expect(result.current).toBeGreaterThan(0);
    expect(result.lastActiveDay).toBe(TODAY);
  });

  it('returns streak of 0 when no logs', () => {
    const result = currentStreak([], TODAY);
    expect(result.current).toBe(0);
    expect(result.lastActiveDay).toBeNull();
  });

  it('uses today date string when no today param provided', () => {
    // Just check it doesn't throw and returns a StreakResult shape
    const result = currentStreak([]);
    expect(typeof result.current).toBe('number');
    expect(result.gapDays).toBeDefined();
  });
});
