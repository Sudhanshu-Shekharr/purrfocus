export interface Task {
  id: string;
  text: string;
  done: boolean;
  subject?: string;
  createdAt: number;
  doneAt?: number;
  pomodoros: number;
}

export interface IntentionsPersistedState {
  tasks: Task[];
  activeTaskId: string | null;
  subject: string;
}

export interface IntentionsActions {
  addTask: (text: string, subject?: string) => Task | null;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  setActiveTask: (id: string | null) => void;
  setSubject: (subject: string) => void;
  reorderTasks: (fromIndex: number, toIndex: number) => void;
  incrementActiveTaskPomodoro: (sessionId?: string) => void;
  clearCompletedTasks: () => void;
}

export type IntentionsState = IntentionsPersistedState & IntentionsActions;
