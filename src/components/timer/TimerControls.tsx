import React, { useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { PillButton, IconButton, Tooltip, Kbd } from '@/components/ui';
import { useTimerStore } from '@/features/timer/store';
import { selectNextMode } from '@/features/timer/selectors';
import { AdjustPopover } from './AdjustPopover';

export type TimerControlsProps = {
  className?: string;
};

export const timerControlsRenderCount = { current: 0 };

export const TimerControls: React.FC<TimerControlsProps> = React.memo(function TimerControls({
  className,
}) {
  timerControlsRenderCount.current++;
  const status = useTimerStore(s => s.status);
  const mode = useTimerStore(s => s.mode);
  const nextMode = useTimerStore(selectNextMode);

  const handlePrimaryClick = useCallback(() => {
    const store = useTimerStore.getState();
    switch (store.status) {
      case 'idle':
        store.start();
        break;
      case 'running':
        store.pause();
        break;
      case 'paused':
        store.resume();
        break;
      case 'finished':
        store.advance();
        break;
    }
  }, []);

  const handleResetClick = useCallback(() => {
    useTimerStore.getState().reset();
  }, []);

  let primaryLabel = 'Start focusing';
  let primaryIcon = <Play className="h-4 w-4 fill-current" />;

  if (status === 'running') {
    primaryLabel = 'Pause';
    primaryIcon = <Pause className="h-4 w-4 fill-current" />;
  } else if (status === 'paused') {
    primaryLabel = 'Resume';
    primaryIcon = <Play className="h-4 w-4 fill-current" />;
  } else if (status === 'finished') {
    if (nextMode === 'focus') {
      primaryLabel = 'Start focusing';
    } else if (nextMode === 'shortBreak') {
      primaryLabel = 'Start short break';
    } else {
      primaryLabel = 'Start long break';
    }
    primaryIcon = <Play className="h-4 w-4 fill-current" />;
  } else {
    // idle
    primaryLabel = mode === 'focus' ? 'Start focusing' : 'Start break';
    primaryIcon = <Play className="h-4 w-4 fill-current" />;
  }

  const isResetDisabled = status === 'idle';

  return (
    <div
      className={
        className ?? 'flex items-center justify-center gap-3 w-full max-w-sm mb-8'
      }
    >
      <AdjustPopover />

      <Tooltip
        content={
          <span className="flex items-center gap-1.5">
            <span>{status === 'running' ? 'Pause' : 'Start'}</span>
            <Kbd>Space</Kbd>
          </span>
        }
      >
        <PillButton
          variant="primary"
          size="lg"
          leftIcon={primaryIcon}
          type="button"
          onClick={handlePrimaryClick}
          className="shadow-lift flex-1"
        >
          {primaryLabel}
        </PillButton>
      </Tooltip>

      <Tooltip
        content={
          <span className="flex items-center gap-1.5">
            <span>Reset session</span>
            <Kbd>R</Kbd>
          </span>
        }
      >
        <IconButton
          label="Reset session"
          size="md"
          type="button"
          disabled={isResetDisabled}
          onClick={handleResetClick}
        >
          <RotateCcw className="h-4 w-4" />
        </IconButton>
      </Tooltip>
    </div>
  );
});
