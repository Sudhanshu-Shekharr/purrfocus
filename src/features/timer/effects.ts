import { useEffect } from 'react';
import { subscribeTimerEvents } from './events';
import { useTimerStore } from './store';
import { playChime, primeAudioContext } from '@/features/audio/chime';
import { requestNotificationPermissionOnce, showTimerNotification } from '@/lib/notify';
import { useToast } from '@/components/ui';
import { recordCompletedFocusSession } from '@/features/intentions/completion';
import { useMoodPromptStore } from '@/features/journal/moodPromptStore';
import { usePrefsStore } from '@/features/prefs/store';

export function getNotificationBody(mode: 'focus' | 'shortBreak' | 'longBreak'): string {
  if (mode === 'focus') {
    return 'Focus done. Stretch a little.';
  }
  return 'Break finished. Ready when you are.';
}

/**
 * Initializes listeners for side-effects: chime, notifications, toast.
 */
export function useTimerEffects(): void {
  const { show: showToast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeTimerEvents(event => {
      const state = useTimerStore.getState();

      if (event.type === 'start') {
        primeAudioContext();
        requestNotificationPermissionOnce().catch(() => {});
      } else if (event.type === 'finish') {
        if (state.chimeOnFinish) {
          playChime();
        }
        showTimerNotification('Purrfocus', getNotificationBody(event.mode));
        if (event.mode === 'focus' && state.sessionId) {
          const minutes = Math.round(state.durations.focus / 60);
          recordCompletedFocusSession({
            sessionId: state.sessionId,
            minutes,
            source: 'finish',
          });
          const isFocusMode = usePrefsStore.getState().focusMode;
          const sessionData = { sessionId: state.sessionId, minutes };
          if (isFocusMode) {
            useMoodPromptStore.getState().setDeferredSession(sessionData);
          } else {
            useMoodPromptStore.getState().setPendingSession(sessionData);
          }
        }
      } else if (event.type === 'recovered') {
        showToast({
          message: 'Your session finished while you were away.',
          tone: 'default',
        });
        if (event.mode === 'focus' && state.sessionId) {
          const minutes = Math.round(state.durations.focus / 60);
          recordCompletedFocusSession({
            sessionId: state.sessionId,
            minutes,
            source: 'recovered',
          });
          const isFocusMode = usePrefsStore.getState().focusMode;
          const sessionData = { sessionId: state.sessionId, minutes };
          if (isFocusMode) {
            useMoodPromptStore.getState().setDeferredSession(sessionData);
          } else {
            useMoodPromptStore.getState().setPendingSession(sessionData);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [showToast]);
}
