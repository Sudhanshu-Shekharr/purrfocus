import { create } from 'zustand';

export type PendingMoodSession = {
  sessionId: string;
  minutes: number;
};

export type MoodPromptStore = {
  pendingSession: PendingMoodSession | null;
  deferredSession: PendingMoodSession | null;
  setPendingSession: (session: PendingMoodSession | null) => void;
  setDeferredSession: (session: PendingMoodSession | null) => void;
  dismiss: () => void;
};

export const useMoodPromptStore = create<MoodPromptStore>((set) => ({
  pendingSession: null,
  deferredSession: null,
  setPendingSession: (pendingSession) => set({ pendingSession }),
  setDeferredSession: (deferredSession) => set({ deferredSession }),
  dismiss: () => set({ pendingSession: null, deferredSession: null }),
}));
