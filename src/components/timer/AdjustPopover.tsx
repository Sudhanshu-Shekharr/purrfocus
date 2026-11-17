import React, { useState, useEffect, useCallback } from 'react';
import { Popover, Modal, PillButton, Toggle, TextField } from '@/components/ui';
import { useIsMobile } from '@/hooks';
import { useTimerStore } from '@/features/timer/store';
import {
  MIN_DURATION_MINUTES,
  MAX_DURATION_MINUTES,
  MIN_CYCLES,
  MAX_CYCLES,
} from '@/features/timer/constants';

function parseInteger(val: string): number | null {
  const trimmed = val.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  return Number.isSafeInteger(num) ? num : null;
}

export type AdjustPopoverProps = {
  className?: string;
};

export const AdjustPopover: React.FC<AdjustPopoverProps> = ({ className }) => {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const durations = useTimerStore(s => s.durations);
  const cycles = useTimerStore(s => s.cyclesBeforeLongBreak);
  const autoStartNext = useTimerStore(s => s.autoStartNext);
  const chimeOnFinish = useTimerStore(s => s.chimeOnFinish);
  const status = useTimerStore(s => s.status);

  const isActiveSession = status === 'running' || status === 'paused';

  // Local draft state
  const [focusMin, setFocusMin] = useState(String(Math.round(durations.focus / 60)));
  const [shortMin, setShortMin] = useState(String(Math.round(durations.shortBreak / 60)));
  const [longMin, setLongMin] = useState(String(Math.round(durations.longBreak / 60)));
  const [cyclesVal, setCyclesVal] = useState(String(cycles));
  const [autoStartVal, setAutoStartVal] = useState(autoStartNext);
  const [chimeVal, setChimeVal] = useState(chimeOnFinish);

  // Sync draft when store changes externally
  const resetDraft = useCallback(() => {
    setFocusMin(String(Math.round(durations.focus / 60)));
    setShortMin(String(Math.round(durations.shortBreak / 60)));
    setLongMin(String(Math.round(durations.longBreak / 60)));
    setCyclesVal(String(cycles));
    setAutoStartVal(autoStartNext);
    setChimeVal(chimeOnFinish);
  }, [durations, cycles, autoStartNext, chimeOnFinish]);

  useEffect(() => {
    resetDraft();
  }, [resetDraft]);

  // Validation
  const parsedFocus = parseInteger(focusMin);
  const focusError =
    parsedFocus === null ||
    parsedFocus < MIN_DURATION_MINUTES ||
    parsedFocus > MAX_DURATION_MINUTES
      ? 'Pick between 1 and 180 minutes'
      : undefined;

  const parsedShort = parseInteger(shortMin);
  const shortError =
    parsedShort === null ||
    parsedShort < MIN_DURATION_MINUTES ||
    parsedShort > MAX_DURATION_MINUTES
      ? 'Pick between 1 and 180 minutes'
      : undefined;

  const parsedLong = parseInteger(longMin);
  const longError =
    parsedLong === null ||
    parsedLong < MIN_DURATION_MINUTES ||
    parsedLong > MAX_DURATION_MINUTES
      ? 'Pick between 1 and 180 minutes'
      : undefined;

  const parsedCycles = parseInteger(cyclesVal);
  const cyclesError =
    parsedCycles === null || parsedCycles < MIN_CYCLES || parsedCycles > MAX_CYCLES
      ? 'Pick between 1 and 12 cycles'
      : undefined;

  const isValid = !focusError && !shortError && !longError && !cyclesError;

  const handleSave = (close: () => void) => {
    if (!isValid || parsedFocus === null || parsedShort === null || parsedLong === null || parsedCycles === null) {
      return;
    }

    useTimerStore.getState().applySettings({
      durations: {
        focus: parsedFocus * 60,
        shortBreak: parsedShort * 60,
        longBreak: parsedLong * 60,
      },
      cyclesBeforeLongBreak: parsedCycles,
      autoStartNext: autoStartVal,
      chimeOnFinish: chimeVal,
    });

    close();
  };

  const handleCancel = (close: () => void) => {
    resetDraft();
    close();
  };

  const renderFormContent = (close: () => void) => (
    <div className="flex flex-col gap-4 text-left">
      <div className="border-b border-glass-border/40 pb-2">
        <h3 className="font-serif text-title text-ink-900">Timer Settings</h3>
        {isActiveSession && (
          <p className="font-sans text-micro text-accent font-medium mt-1">
            New lengths apply from your next session.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <TextField
          label="Focus (minutes)"
          value={focusMin}
          onChange={setFocusMin}
          error={focusError}
          type="number"
        />

        <TextField
          label="Short break (minutes)"
          value={shortMin}
          onChange={setShortMin}
          error={shortError}
          type="number"
        />

        <TextField
          label="Long break (minutes)"
          value={longMin}
          onChange={setLongMin}
          error={longError}
          type="number"
        />

        <TextField
          label="Cycles before long break"
          value={cyclesVal}
          onChange={setCyclesVal}
          error={cyclesError}
          type="number"
        />
      </div>

      <div className="flex flex-col gap-3 pt-2 border-t border-glass-border/30">
        <Toggle
          label="Auto-start next session"
          checked={autoStartVal}
          onChange={setAutoStartVal}
        />

        <Toggle
          label="Chime when done"
          checked={chimeVal}
          onChange={setChimeVal}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-glass-border/40">
        <PillButton
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => handleCancel(close)}
        >
          Cancel
        </PillButton>

        <PillButton
          variant="primary"
          size="sm"
          type="button"
          disabled={!isValid}
          onClick={() => handleSave(close)}
        >
          Save
        </PillButton>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <PillButton
          variant="glass"
          size="md"
          type="button"
          aria-label="Adjust timer settings"
          onClick={() => setSheetOpen(true)}
          className={className}
        >
          Adjust
        </PillButton>

        <Modal
          open={sheetOpen}
          onClose={() => {
            resetDraft();
            setSheetOpen(false);
          }}
          variant="bottom"
          title="Timer Settings"
          showTitle={false}
          className="w-full max-h-[85vh] overflow-y-auto"
        >
          {renderFormContent(() => setSheetOpen(false))}
        </Modal>
      </>
    );
  }

  return (
    <Popover
      role="dialog"
      ariaLabel="Adjust timer settings"
      className={className ?? 'w-80 p-5'}
      trigger={
        <PillButton variant="glass" size="md" type="button" aria-label="Adjust timer settings">
          Adjust
        </PillButton>
      }
    >
      {({ close }) => renderFormContent(close)}
    </Popover>
  );
};
