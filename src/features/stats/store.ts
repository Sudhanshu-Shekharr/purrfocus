import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '@/lib/storageDebounce';
import type { SessionLog, SessionLogV1, StatsState } from './types';
import { getTodayDateString } from '@/features/timer/constants';

export const MAX_STATS_HISTORY = 2000;

type RawEntry = Record<string, unknown>;

function isValidLog(item: unknown): item is SessionLog {
  if (!item || typeof item !== 'object') return false;
  const l = item as RawEntry;

  // Accept new shape (sessionId) or old shape (id) during rehydration
  const hasId =
    (typeof l['sessionId'] === 'string' && (l['sessionId'] as string).length > 0) ||
    (typeof l['id'] === 'string' && (l['id'] as string).length > 0);

  const hasValidCompletedOrEnded =
    (l['completedAt'] === undefined || typeof l['completedAt'] === 'number') &&
    (l['endedAt'] === undefined || typeof l['endedAt'] === 'number');

  return (
    hasId &&
    typeof l['date'] === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(l['date'] as string) &&
    hasValidCompletedOrEnded &&
    typeof l['minutes'] === 'number' &&
    (l['minutes'] as number) > 0 &&
    (l['subject'] === null || l['subject'] === undefined || typeof l['subject'] === 'string')
  );
}

function migrateEntry(entry: RawEntry): SessionLog {
  // id -> sessionId
  const sessionId =
    typeof entry['sessionId'] === 'string'
      ? (entry['sessionId'] as string)
      : (entry['id'] as string);

  // endedAt -> completedAt; fallback: local noon from date
  let completedAt: number;
  if (typeof entry['completedAt'] === 'number') {
    completedAt = entry['completedAt'] as number;
  } else if (typeof entry['endedAt'] === 'number') {
    completedAt = entry['endedAt'] as number;
  } else {
    // Compute local noon from date string YYYY-MM-DD
    const dateStr = entry['date'] as string;
    const [y, m, d] = dateStr.split('-').map(Number);
    const noon = new Date(y!, m! - 1, d!);
    noon.setHours(12, 0, 0, 0);
    completedAt = noon.getTime();
  }

  return {
    sessionId,
    date: entry['date'] as string,
    completedAt,
    minutes: entry['minutes'] as number,
    subject: (entry['subject'] as string | null) ?? null,
    mood: undefined,
    note: undefined,
    source: 'finish',
  };
}

export function sanitizeStatsState(persisted: unknown): { logs: SessionLog[] } {
  if (!persisted || typeof persisted !== 'object') {
    return { logs: [] };
  }
  const s = persisted as { logs?: unknown };
  if (!Array.isArray(s.logs)) {
    return { logs: [] };
  }
  const validLogs = s.logs.filter(isValidLog);
  // Migrate any old-shape entries to new shape
  const migratedLogs: SessionLog[] = validLogs.map(entry => {
    const e = entry as RawEntry;
    if (typeof e['sessionId'] === 'string' && typeof e['completedAt'] === 'number' && typeof e['source'] === 'string') {
      // Already v2
      return entry as SessionLog;
    }
    return migrateEntry(e);
  });
  return {
    logs: migratedLogs.slice(-MAX_STATS_HISTORY),
  };
}

export function migrate(persistedState: unknown, version: number): { logs: SessionLog[] } {
  if (version < 2) {
    // Run full sanitize which also handles old-shape migration
    return sanitizeStatsState(persistedState);
  }
  return sanitizeStatsState(persistedState);
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      logs: [],

      logFocusSession: ({
        sessionId,
        id,
        minutes,
        subject = null,
        date = getTodayDateString(),
        completedAt,
        endedAt,
        source = 'finish',
      }) => {
        const finalSessionId = sessionId ?? id;
        if (!finalSessionId || minutes <= 0) return;

        const currentLogs = get().logs;
        // Idempotent: ignore if session with this sessionId already logged
        if (currentLogs.some(l => l.sessionId === finalSessionId)) {
          return;
        }

        const finalCompletedAt = completedAt ?? endedAt ?? Date.now();

        const newLog: SessionLog = {
          sessionId: finalSessionId,
          date,
          completedAt: finalCompletedAt,
          minutes: Math.max(1, Math.round(minutes)),
          subject,
          source,
        };

        const nextLogs = [...currentLogs, newLog].slice(-MAX_STATS_HISTORY);
        set({ logs: nextLogs });
      },

      updateSessionMoodNote: (sessionId, mood, note) => {
        const currentLogs = get().logs;
        const idx = currentLogs.findIndex(l => l.sessionId === sessionId);
        if (idx === -1) return;

        const updated = [...currentLogs];
        updated[idx] = { ...updated[idx]!, mood, note };
        set({ logs: updated });
      },

      clearLogs: () => {
        set({ logs: [] });
      },
    }),
    {
      name: 'purrfocus:stats:v1',
      version: 2,
      storage: createJSONStorage(() => debouncedStorage),
      migrate: (persistedState, version) => migrate(persistedState, version),
      onRehydrateStorage: () => state => {
        if (state) {
          const sanitized = sanitizeStatsState(state);
          state.logs = sanitized.logs;
        }
      },
    },
  ),
);

export function selectTodayMinutes(
  state: StatsState,
  today: string = getTodayDateString(),
): number {
  return state.logs.reduce((acc, log) => {
    if (log.date === today) {
      return acc + log.minutes;
    }
    return acc;
  }, 0);
}

// Re-export SessionLogV1 for external use in tests
export type { SessionLogV1 };
