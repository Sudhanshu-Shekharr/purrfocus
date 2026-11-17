import React, { useState, useEffect, useRef } from 'react';
import { VisuallyHidden } from '@/components/ui';
import { subscribeTimerEvents } from '@/features/timer/events';
import { useTimerStore } from '@/features/timer/store';
import { MODE_LABELS } from '@/features/timer/constants';

export const TimerAnnouncer: React.FC = () => {
  const [announcement, setAnnouncement] = useState('');
  const lastAnnouncedMinuteRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. Subscribe to timer store to announce whole-minute boundaries
    const unsubscribeStore = useTimerStore.subscribe(state => {
      if (state.status !== 'running') {
        lastAnnouncedMinuteRef.current = null;
        return;
      }

      // Announce strictly on whole minute boundaries (e.g. 24:00, 23:00)
      const minute = state.remaining / 60;
      if (
        Number.isInteger(minute) &&
        minute > 0 &&
        minute !== lastAnnouncedMinuteRef.current &&
        state.remaining < state.durations[state.mode]
      ) {
        lastAnnouncedMinuteRef.current = minute;
        const unit = minute === 1 ? 'minute' : 'minutes';
        setAnnouncement(`${minute} ${unit} remaining`);
      }
    });

    // 2. Subscribe to discrete lifecycle events
    const unsubscribeEvents = subscribeTimerEvents(event => {
      const modeLabel = MODE_LABELS[event.mode] ?? 'Timer';
      switch (event.type) {
        case 'start': {
          const state = useTimerStore.getState();
          const mins = Math.round(state.remaining / 60);
          const unit = mins === 1 ? 'minute' : 'minutes';
          lastAnnouncedMinuteRef.current = mins;
          setAnnouncement(`${modeLabel} session started, ${mins} ${unit} remaining`);
          break;
        }
        case 'pause':
          setAnnouncement(`${modeLabel} paused`);
          break;
        case 'resume':
          setAnnouncement(`${modeLabel} resumed`);
          break;
        case 'reset':
          setAnnouncement('Timer reset');
          break;
        case 'finish':
          setAnnouncement(`${modeLabel} complete. Time for a break.`);
          break;
        case 'modeChange':
          setAnnouncement(`Switched to ${modeLabel}`);
          break;
        case 'recovered':
          setAnnouncement(`${modeLabel} completed while away`);
          break;
      }
    });

    return () => {
      unsubscribeStore();
      unsubscribeEvents();
    };
  }, []);

  return (
    <VisuallyHidden>
      <div role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </VisuallyHidden>
  );
};

export default TimerAnnouncer;
