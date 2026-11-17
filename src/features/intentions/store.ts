import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task, IntentionsPersistedState, IntentionsState } from './types';
import { emitIntention } from './events';

export const MAX_TASKS = 100;
export const MAX_TASK_TEXT_LENGTH = 120;
export const MAX_SUBJECT_LENGTH = 60;

function isValidTask(item: unknown): item is Task {
  if (!item || typeof item !== 'object') return false;
  const t = item as Partial<Task>;
  return (
    typeof t.id === 'string' &&
    t.id.length > 0 &&
    typeof t.text === 'string' &&
    typeof t.done === 'boolean' &&
    typeof t.createdAt === 'number' &&
    typeof t.pomodoros === 'number'
  );
}

export function sanitizeIntentionsState(persisted: unknown): IntentionsPersistedState {
  const fallback: IntentionsPersistedState = {
    tasks: [],
    activeTaskId: null,
    subject: '',
  };

  if (!persisted || typeof persisted !== 'object') {
    return fallback;
  }

  const p = persisted as Partial<IntentionsPersistedState>;
  const validTasks = Array.isArray(p.tasks)
    ? p.tasks.filter(isValidTask).slice(0, MAX_TASKS)
    : [];

  const subject = typeof p.subject === 'string' ? p.subject.slice(0, MAX_SUBJECT_LENGTH) : '';
  const activeTaskId =
    typeof p.activeTaskId === 'string' && validTasks.some(t => t.id === p.activeTaskId)
      ? p.activeTaskId
      : null;

  return {
    tasks: validTasks,
    activeTaskId,
    subject,
  };
}

export const useIntentionsStore = create<IntentionsState>()(
  persist(
    (set, get) => ({
      tasks: [],
      activeTaskId: null,
      subject: '',

      addTask: (text: string, subject?: string) => {
        const trimmed = text.trim().slice(0, MAX_TASK_TEXT_LENGTH);
        if (!trimmed) return null;

        const currentTasks = get().tasks;
        if (currentTasks.length >= MAX_TASKS) {
          return null;
        }

        const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newTask: Task = {
          id,
          text: trimmed,
          done: false,
          subject: subject ? subject.trim().slice(0, MAX_SUBJECT_LENGTH) : undefined,
          createdAt: Date.now(),
          pomodoros: 0,
        };

        set({ tasks: [...currentTasks, newTask] });
        return newTask;
      },

      toggleTask: (id: string) => {
        let completedTask: Task | null = null;

        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.id !== id) return t;
            const willBeDone = !t.done;
            const updated: Task = {
              ...t,
              done: willBeDone,
              doneAt: willBeDone ? Date.now() : undefined,
            };
            if (willBeDone) {
              completedTask = updated;
            }
            return updated;
          }),
        }));

        if (completedTask) {
          emitIntention({ type: 'taskDone', task: completedTask });
        }
      },

      deleteTask: (id: string) => {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id),
          activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
        }));
      },

      setActiveTask: (id: string | null) => {
        const currentActive = get().activeTaskId;
        if (id === null || currentActive === id) {
          set({ activeTaskId: null });
        } else {
          const taskExists = get().tasks.some(t => t.id === id);
          if (taskExists) {
            set({ activeTaskId: id });
          }
        }
      },

      setSubject: (subject: string) => {
        set({ subject: subject.slice(0, MAX_SUBJECT_LENGTH) });
      },

      reorderTasks: (fromIndex: number, toIndex: number) => {
        const { tasks } = get();
        if (
          fromIndex < 0 ||
          fromIndex >= tasks.length ||
          toIndex < 0 ||
          toIndex >= tasks.length ||
          fromIndex === toIndex
        ) {
          return;
        }

        const next = [...tasks];
        const [moved] = next.splice(fromIndex, 1);
        if (moved) {
          next.splice(toIndex, 0, moved);
          set({ tasks: next });
        }
      },

      incrementActiveTaskPomodoro: (sessionId?: string) => {
        const { activeTaskId, tasks } = get();
        if (!activeTaskId) return;

        const taskExists = tasks.some(t => t.id === activeTaskId);
        if (!taskExists) return;

        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.id === activeTaskId) {
              return { ...t, pomodoros: t.pomodoros + 1 };
            }
            return t;
          }),
        }));

        emitIntention({ type: 'pomodoroCounted', taskId: activeTaskId, sessionId });
      },

      clearCompletedTasks: () => {
        set(state => {
          const remaining = state.tasks.filter(t => !t.done);
          const activeStillExists = remaining.some(t => t.id === state.activeTaskId);
          return {
            tasks: remaining,
            activeTaskId: activeStillExists ? state.activeTaskId : null,
          };
        });
      },
    }),
    {
      name: 'purrfocus:intentions:v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: persisted => sanitizeIntentionsState(persisted),
      onRehydrateStorage: () => state => {
        if (state) {
          const sanitized = sanitizeIntentionsState(state);
          state.tasks = sanitized.tasks;
          state.activeTaskId = sanitized.activeTaskId;
          state.subject = sanitized.subject;
        }
      },
    },
  ),
);
