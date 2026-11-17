import { describe, it, expect, beforeEach } from 'vitest';
import {
  useStatsStore,
  selectTodayMinutes,
  sanitizeStatsState,
  migrate,
  MAX_STATS_HISTORY,
} from './store';
import type { SessionLog } from './types';

describe('Stats Store', () => {
  beforeEach(() => {
    localStorage.clear();
    useStatsStore.getState().clearLogs();
  });

  it('logs completed focus session and computes today minutes', () => {
    useStatsStore.getState().logFocusSession({
      sessionId: 'session-1',
      minutes: 25,
      date: '2026-10-28',
    });

    const state = useStatsStore.getState();
    expect(state.logs).toHaveLength(1);
    expect(state.logs[0]?.minutes).toBe(25);
    expect(selectTodayMinutes(state, '2026-10-28')).toBe(25);
  });

  it('is idempotent by session id (does not double count)', () => {
    useStatsStore.getState().logFocusSession({
      sessionId: 'session-1',
      minutes: 25,
      date: '2026-10-28',
    });

    // Attempt to log same session ID again
    useStatsStore.getState().logFocusSession({
      sessionId: 'session-1',
      minutes: 25,
      date: '2026-10-28',
    });

    const state = useStatsStore.getState();
    expect(state.logs).toHaveLength(1);
    expect(selectTodayMinutes(state, '2026-10-28')).toBe(25);
  });

  it('filters by date when computing today minutes (handles day rollover)', () => {
    useStatsStore.getState().logFocusSession({
      sessionId: 'session-yesterday',
      minutes: 50,
      date: '2026-10-27',
    });

    useStatsStore.getState().logFocusSession({
      sessionId: 'session-today',
      minutes: 25,
      date: '2026-10-28',
    });

    const state = useStatsStore.getState();
    expect(selectTodayMinutes(state, '2026-10-28')).toBe(25);
    expect(selectTodayMinutes(state, '2026-10-27')).toBe(50);
    expect(selectTodayMinutes(state, '2026-10-29')).toBe(0);
  });

  it('caps history at MAX_STATS_HISTORY (2000 entries)', () => {
    const bulkLogs: SessionLog[] = Array.from({ length: 2005 }, (_, i) => ({
      sessionId: `bulk-${i}`,
      date: '2026-10-28',
      completedAt: 1000000 + i,
      minutes: 25,
      subject: null,
      source: 'finish' as const,
    }));

    useStatsStore.setState({ logs: bulkLogs.slice(0, 2000) });
    expect(useStatsStore.getState().logs).toHaveLength(2000);

    // Adding one more caps at 2000
    useStatsStore.getState().logFocusSession({
      sessionId: 'new-one',
      minutes: 25,
      date: '2026-10-28',
    });

    expect(useStatsStore.getState().logs).toHaveLength(MAX_STATS_HISTORY);
    expect(useStatsStore.getState().logs[MAX_STATS_HISTORY - 1]?.sessionId).toBe('new-one');
  });

  it('sanitizes corrupt persisted state safely', () => {
    const corrupt = {
      logs: [
        {
          sessionId: 'valid-1',
          date: '2026-10-28',
          completedAt: 1000,
          minutes: 25,
          subject: null,
          source: 'finish',
        },
        { sessionId: '', date: 'invalid', minutes: -5 },
        null,
        'not an object',
      ],
    };

    const sanitized = sanitizeStatsState(corrupt);
    expect(sanitized.logs).toHaveLength(1);
    expect(sanitized.logs[0]?.sessionId).toBe('valid-1');
  });

  it('updateSessionMoodNote updates mood and note for a known session', () => {
    useStatsStore.getState().logFocusSession({
      sessionId: 'session-mood',
      minutes: 25,
      date: '2026-10-28',
    });

    useStatsStore.getState().updateSessionMoodNote('session-mood', 4, 'Felt great!');

    const log = useStatsStore.getState().logs.find(l => l.sessionId === 'session-mood');
    expect(log?.mood).toBe(4);
    expect(log?.note).toBe('Felt great!');
  });

  it('updateSessionMoodNote does nothing for unknown session', () => {
    useStatsStore.getState().logFocusSession({
      sessionId: 'session-exists',
      minutes: 25,
      date: '2026-10-28',
    });

    useStatsStore.getState().updateSessionMoodNote('session-nonexistent', 3, 'Nope');

    const logs = useStatsStore.getState().logs;
    expect(logs).toHaveLength(1);
    expect(logs[0]?.mood).toBeUndefined();
  });

  it('source field defaults to finish when not specified', () => {
    useStatsStore.getState().logFocusSession({
      sessionId: 'session-src',
      minutes: 25,
      date: '2026-10-28',
    });

    const log = useStatsStore.getState().logs.find(l => l.sessionId === 'session-src');
    expect(log?.source).toBe('finish');
  });

  it('source field can be set to recovered', () => {
    useStatsStore.getState().logFocusSession({
      sessionId: 'session-recovered',
      minutes: 25,
      date: '2026-10-28',
      source: 'recovered',
    });

    const log = useStatsStore.getState().logs.find(l => l.sessionId === 'session-recovered');
    expect(log?.source).toBe('recovered');
  });

  describe('migrate()', () => {
    it('migrates v1 shape (id/endedAt) to v2 shape (sessionId/completedAt)', () => {
      const v1State = {
        logs: [
          {
            id: 'old-session-1',
            date: '2026-10-28',
            endedAt: 1234567890000,
            minutes: 25,
            subject: 'History',
          },
        ],
      };

      const result = migrate(v1State, 1);
      expect(result.logs).toHaveLength(1);
      const log = result.logs[0]!;
      expect(log.sessionId).toBe('old-session-1');
      expect(log.completedAt).toBe(1234567890000);
      expect(log.minutes).toBe(25);
      expect(log.subject).toBe('History');
      expect(log.source).toBe('finish');
      expect(log.mood).toBeUndefined();
      expect(log.note).toBeUndefined();
    });

    it('migrates v1 shape with missing endedAt: computes local noon from date', () => {
      const v1State = {
        logs: [
          {
            id: 'old-session-2',
            date: '2026-10-28',
            minutes: 25,
            subject: null,
            // No endedAt - should compute local noon
          },
        ],
      };

      const result = migrate(v1State, 1);
      expect(result.logs).toHaveLength(1);
      const log = result.logs[0]!;
      expect(log.sessionId).toBe('old-session-2');
      // Should be local noon of 2026-10-28
      const noon = new Date(2026, 9, 28, 12, 0, 0, 0); // month is 0-indexed
      expect(log.completedAt).toBe(noon.getTime());
      expect(log.source).toBe('finish');
    });

    it('passes through v2 entries unchanged from migrate()', () => {
      const v2State = {
        logs: [
          {
            sessionId: 'new-session-1',
            date: '2026-10-28',
            completedAt: 1700000000000,
            minutes: 30,
            subject: 'Math',
            source: 'recovered',
          },
        ],
      };

      const result = migrate(v2State, 2);
      expect(result.logs).toHaveLength(1);
      const log = result.logs[0]!;
      expect(log.sessionId).toBe('new-session-1');
      expect(log.completedAt).toBe(1700000000000);
      expect(log.source).toBe('recovered');
    });

    it('filters out invalid entries during migration', () => {
      const v1State = {
        logs: [
          { id: 'valid', date: '2026-10-28', endedAt: 1000, minutes: 25, subject: null },
          { id: '', date: 'invalid-date', minutes: -1 }, // invalid
          null,
        ],
      };

      const result = migrate(v1State, 1);
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0]?.sessionId).toBe('valid');
    });
  });
});
