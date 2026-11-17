import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useIntentionsStore,
  sanitizeIntentionsState,
  MAX_TASKS,
  MAX_TASK_TEXT_LENGTH,
  MAX_SUBJECT_LENGTH,
} from './store';
import { subscribeIntention, _clearIntentionListenersForTest } from './events';

describe('Intentions Store', () => {
  beforeEach(() => {
    _clearIntentionListenersForTest();
    useIntentionsStore.setState({
      tasks: [],
      activeTaskId: null,
      subject: '',
    });
  });

  it('initializes with empty tasks and empty subject', () => {
    const state = useIntentionsStore.getState();
    expect(state.tasks).toEqual([]);
    expect(state.activeTaskId).toBeNull();
    expect(state.subject).toBe('');
  });

  describe('addTask', () => {
    it('adds a valid task with trimmed text', () => {
      const task = useIntentionsStore.getState().addTask('  Study Chapter 4  ');
      expect(task).toBeDefined();
      expect(task?.text).toBe('Study Chapter 4');
      expect(task?.done).toBe(false);
      expect(task?.pomodoros).toBe(0);
      expect(typeof task?.createdAt).toBe('number');
      expect(useIntentionsStore.getState().tasks).toHaveLength(1);
    });

    it('rejects empty or whitespace-only text', () => {
      const res1 = useIntentionsStore.getState().addTask('');
      const res2 = useIntentionsStore.getState().addTask('    ');
      expect(res1).toBeNull();
      expect(res2).toBeNull();
      expect(useIntentionsStore.getState().tasks).toHaveLength(0);
    });

    it('truncates text to MAX_TASK_TEXT_LENGTH (120 chars)', () => {
      const longText = 'a'.repeat(200);
      const task = useIntentionsStore.getState().addTask(longText);
      expect(task?.text).toHaveLength(MAX_TASK_TEXT_LENGTH);
    });

    it('respects MAX_TASKS limit (100)', () => {
      for (let i = 0; i < MAX_TASKS; i++) {
        useIntentionsStore.getState().addTask(`Task ${i}`);
      }
      expect(useIntentionsStore.getState().tasks).toHaveLength(MAX_TASKS);

      const overflow = useIntentionsStore.getState().addTask('Overflow task');
      expect(overflow).toBeNull();
      expect(useIntentionsStore.getState().tasks).toHaveLength(MAX_TASKS);
    });
  });

  describe('toggleTask', () => {
    it('toggles done state, sets doneAt, and emits taskDone event when completed', () => {
      const task = useIntentionsStore.getState().addTask('Write essay')!;
      const listener = vi.fn();
      const unsub = subscribeIntention(listener);

      // Toggle to done
      useIntentionsStore.getState().toggleTask(task.id);

      const updated = useIntentionsStore.getState().tasks[0]!;
      expect(updated.done).toBe(true);
      expect(typeof updated.doneAt).toBe('number');
      expect(listener).toHaveBeenCalledWith({
        type: 'taskDone',
        task: expect.objectContaining({ id: task.id, done: true }),
      });

      // Toggle back to not done
      listener.mockClear();
      useIntentionsStore.getState().toggleTask(task.id);
      const undone = useIntentionsStore.getState().tasks[0]!;
      expect(undone.done).toBe(false);
      expect(undone.doneAt).toBeUndefined();
      expect(listener).not.toHaveBeenCalled();

      unsub();
    });
  });

  describe('deleteTask', () => {
    it('removes task and clears activeTaskId if deleted task was active', () => {
      const t1 = useIntentionsStore.getState().addTask('Task 1')!;
      const t2 = useIntentionsStore.getState().addTask('Task 2')!;
      useIntentionsStore.getState().setActiveTask(t1.id);
      expect(useIntentionsStore.getState().activeTaskId).toBe(t1.id);

      useIntentionsStore.getState().deleteTask(t1.id);
      expect(useIntentionsStore.getState().tasks.map(t => t.id)).toEqual([t2.id]);
      expect(useIntentionsStore.getState().activeTaskId).toBeNull();
    });
  });

  describe('setActiveTask', () => {
    it('sets active task and toggles it off when clicked again', () => {
      const t1 = useIntentionsStore.getState().addTask('Task 1')!;
      useIntentionsStore.getState().setActiveTask(t1.id);
      expect(useIntentionsStore.getState().activeTaskId).toBe(t1.id);

      // Click same task again -> toggles off
      useIntentionsStore.getState().setActiveTask(t1.id);
      expect(useIntentionsStore.getState().activeTaskId).toBeNull();
    });

    it('ignores invalid task id', () => {
      useIntentionsStore.getState().setActiveTask('non-existent');
      expect(useIntentionsStore.getState().activeTaskId).toBeNull();
    });
  });

  describe('setSubject', () => {
    it('sets subject and clamps to MAX_SUBJECT_LENGTH (60 chars)', () => {
      useIntentionsStore.getState().setSubject('Biology Chapter 3');
      expect(useIntentionsStore.getState().subject).toBe('Biology Chapter 3');

      const longSubject = 'x'.repeat(100);
      useIntentionsStore.getState().setSubject(longSubject);
      expect(useIntentionsStore.getState().subject).toHaveLength(MAX_SUBJECT_LENGTH);
    });
  });

  describe('reorderTasks', () => {
    it('reorders tasks safely', () => {
      const t1 = useIntentionsStore.getState().addTask('Task 1')!;
      const t2 = useIntentionsStore.getState().addTask('Task 2')!;
      const t3 = useIntentionsStore.getState().addTask('Task 3')!;

      // Move Task 1 (index 0) to index 2
      useIntentionsStore.getState().reorderTasks(0, 2);
      expect(useIntentionsStore.getState().tasks.map(t => t.id)).toEqual([t2.id, t3.id, t1.id]);
    });

    it('ignores invalid indices', () => {
      const t1 = useIntentionsStore.getState().addTask('Task 1')!;
      useIntentionsStore.getState().reorderTasks(-1, 5);
      expect(useIntentionsStore.getState().tasks.map(t => t.id)).toEqual([t1.id]);
    });
  });

  describe('incrementActiveTaskPomodoro', () => {
    it('increments pomodoro counter for active task and emits event', () => {
      const t1 = useIntentionsStore.getState().addTask('Task 1')!;
      useIntentionsStore.getState().setActiveTask(t1.id);

      const listener = vi.fn();
      const unsub = subscribeIntention(listener);

      useIntentionsStore.getState().incrementActiveTaskPomodoro('session-42');
      expect(useIntentionsStore.getState().tasks[0]?.pomodoros).toBe(1);
      expect(listener).toHaveBeenCalledWith({
        type: 'pomodoroCounted',
        taskId: t1.id,
        sessionId: 'session-42',
      });

      unsub();
    });

    it('does nothing if no active task is set', () => {
      useIntentionsStore.getState().addTask('Task 1');
      useIntentionsStore.getState().setActiveTask(null);

      const listener = vi.fn();
      const unsub = subscribeIntention(listener);

      useIntentionsStore.getState().incrementActiveTaskPomodoro('session-42');
      expect(listener).not.toHaveBeenCalled();
      expect(useIntentionsStore.getState().tasks[0]?.pomodoros).toBe(0);

      unsub();
    });
  });

  describe('clearCompletedTasks', () => {
    it('removes only completed tasks', () => {
      const t1 = useIntentionsStore.getState().addTask('Task 1')!;
      const t2 = useIntentionsStore.getState().addTask('Task 2')!;
      useIntentionsStore.getState().toggleTask(t1.id);

      useIntentionsStore.getState().clearCompletedTasks();
      expect(useIntentionsStore.getState().tasks.map(t => t.id)).toEqual([t2.id]);
    });
  });

  describe('sanitizeIntentionsState', () => {
    it('falls back to clean defaults on corrupt data', () => {
      const sanitized = sanitizeIntentionsState(null);
      expect(sanitized.tasks).toEqual([]);
      expect(sanitized.activeTaskId).toBeNull();
      expect(sanitized.subject).toBe('');
    });

    it('filters invalid tasks and validates activeTaskId', () => {
      const corrupt = {
        tasks: [
          { id: 'valid', text: 'T1', done: false, createdAt: 100, pomodoros: 0 },
          { id: '', text: 'Invalid ID' },
          'not an object',
        ],
        activeTaskId: 'non-existent',
        subject: 'My subject',
      };
      const sanitized = sanitizeIntentionsState(corrupt);
      expect(sanitized.tasks).toHaveLength(1);
      expect(sanitized.tasks[0]?.id).toBe('valid');
      expect(sanitized.activeTaskId).toBeNull();
      expect(sanitized.subject).toBe('My subject');
    });
  });
});
