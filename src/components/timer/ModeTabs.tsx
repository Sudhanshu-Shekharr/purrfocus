import React, { useCallback } from 'react';
import { SegmentedTabs } from '@/components/ui';
import type { SegmentedOption } from '@/components/ui';
import { useTimerStore } from '@/features/timer/store';
import type { Mode } from '@/features/timer/types';

const MODE_OPTIONS: SegmentedOption<Mode>[] = [
  { value: 'focus', label: 'Focus' },
  { value: 'shortBreak', label: 'Short break' },
  { value: 'longBreak', label: 'Long break' },
];

export type ModeTabsProps = {
  onRequestSwitchConfirm?: (targetMode: Mode) => void;
  className?: string;
};

export const modeTabsRenderCount = { current: 0 };

export const ModeTabs: React.FC<ModeTabsProps> = React.memo(function ModeTabs({
  onRequestSwitchConfirm,
  className,
}) {
  modeTabsRenderCount.current++;
  const mode = useTimerStore(s => s.mode);

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      const state = useTimerStore.getState();
      if (state.mode === newMode) return;

      const hasActiveSession =
        state.status === 'running' ||
        (state.status === 'paused' && state.remaining < state.durations[state.mode]);

      if (hasActiveSession) {
        onRequestSwitchConfirm?.(newMode);
      } else {
        state.switchMode(newMode);
      }
    },
    [onRequestSwitchConfirm],
  );

  return (
    <div className={className ?? 'w-full max-w-xs mb-6'}>
      <SegmentedTabs
        options={MODE_OPTIONS}
        value={mode}
        onChange={handleModeChange}
        controlsId="timer-tabpanel"
      />
    </div>
  );
});
