import { useStatsStore } from '@/features/stats/store';
import { useIntentionsStore } from './store';

export interface CompletedSessionParams {
  sessionId: string;
  minutes: number;
  subject?: string | null;
  source?: 'finish' | 'recovered';
}

/**
 * Single attribution point for completed focus sessions.
 * Coordinates logging session to stats store with active intention subject
 * and incrementing active task pomodoro count.
 */
export function recordCompletedFocusSession({
  sessionId,
  minutes,
  subject,
  source = 'finish',
}: CompletedSessionParams): void {
  if (!sessionId || minutes <= 0) return;

  const intentionsStore = useIntentionsStore.getState();
  const sessionSubject =
    subject !== undefined
      ? subject
      : (intentionsStore.subject.trim() || null);

  // 1. Log to stats store (idempotent on sessionId)
  useStatsStore.getState().logFocusSession({
    sessionId,
    minutes,
    subject: sessionSubject,
    source,
  });

  // 2. Increment pomodoro count for active task if selected
  intentionsStore.incrementActiveTaskPomodoro(sessionId);
}
