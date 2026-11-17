export type SessionLogV1 = {
  id: string;
  date: string;
  endedAt: number;
  minutes: number;
  subject: string | null;
};

export type SessionLog = {
  sessionId: string;
  date: string;
  completedAt: number;
  minutes: number;
  subject: string | null;
  mood?: 1 | 2 | 3 | 4 | 5;
  note?: string; // max 140 chars
  source: 'finish' | 'recovered';
};

export type LogFocusSessionParams = {
  sessionId?: string;
  id?: string;
  minutes: number;
  subject?: string | null;
  date?: string;
  completedAt?: number;
  endedAt?: number;
  source?: 'finish' | 'recovered';
};

export type StatsState = {
  logs: SessionLog[];
  logFocusSession: (params: LogFocusSessionParams) => void;
  updateSessionMoodNote: (
    sessionId: string,
    mood: 1 | 2 | 3 | 4 | 5 | undefined,
    note: string | undefined,
  ) => void;
  clearLogs: () => void;
};
