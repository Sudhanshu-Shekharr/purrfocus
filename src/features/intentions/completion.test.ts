import { describe, it, expect, beforeEach } from 'vitest';
import { recordCompletedFocusSession } from './completion';
import { useStatsStore } from '@/features/stats/store';
import { useIntentionsStore } from './store';
import { subscribeIntention, _clearIntentionListenersForTest } from './events';

describe('recordCompletedFocusSession', () => {
  beforeEach(() => {
    _clearIntentionListenersForTest();
    useStatsStore.setState({ logs: [] });
    useIntentionsStore.setState({
      tasks: [],
      activeTaskId: null,
      subject: '',
    });
  });

  it('logs session to stats store using active intention subject', () => {
    useIntentionsStore.getState().setSubject('Mathematics 101');

    recordCompletedFocusSession({
      sessionId: 'sess-100',
      minutes: 25,
    });

    const logs = useStatsStore.getState().logs;
    expect(logs).toHaveLength(1);
    expect(logs[0]?.sessionId).toBe('sess-100');
    expect(logs[0]?.minutes).toBe(25);
    expect(logs[0]?.subject).toBe('Mathematics 101');
  });

  it('allows explicit subject override', () => {
    useIntentionsStore.getState().setSubject('Default Subject');

    recordCompletedFocusSession({
      sessionId: 'sess-200',
      minutes: 30,
      subject: 'Custom Topic',
    });

    const logs = useStatsStore.getState().logs;
    expect(logs[0]?.subject).toBe('Custom Topic');
  });

  it('increments active task pomodoro count and notifies bus', () => {
    const task = useIntentionsStore.getState().addTask('Solve problems')!;
    useIntentionsStore.getState().setActiveTask(task.id);

    let eventTaskId: string | null = null;
    const unsub = subscribeIntention(event => {
      if (event.type === 'pomodoroCounted') {
        eventTaskId = event.taskId;
      }
    });

    recordCompletedFocusSession({
      sessionId: 'sess-300',
      minutes: 25,
    });

    expect(useIntentionsStore.getState().tasks[0]?.pomodoros).toBe(1);
    expect(eventTaskId).toBe(task.id);

    unsub();
  });

  it('is idempotent: ignores duplicate session IDs in stats store', () => {
    recordCompletedFocusSession({
      sessionId: 'sess-400',
      minutes: 25,
    });
    recordCompletedFocusSession({
      sessionId: 'sess-400',
      minutes: 25,
    });

    const logs = useStatsStore.getState().logs;
    expect(logs).toHaveLength(1);
  });

  it('ignores invalid parameters (empty sessionId or minutes <= 0)', () => {
    recordCompletedFocusSession({
      sessionId: '',
      minutes: 25,
    });
    recordCompletedFocusSession({
      sessionId: 'sess-500',
      minutes: 0,
    });

    expect(useStatsStore.getState().logs).toHaveLength(0);
  });
});
