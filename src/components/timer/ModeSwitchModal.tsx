import React from 'react';
import { Modal, PillButton } from '@/components/ui';
import { useTimerStore } from '@/features/timer/store';
import { MODE_LABELS } from '@/features/timer/constants';
import type { Mode } from '@/features/timer/types';

export type ModeSwitchModalProps = {
  targetMode: Mode | null;
  open: boolean;
  onClose: () => void;
};

export const ModeSwitchModal: React.FC<ModeSwitchModalProps> = ({
  targetMode,
  open,
  onClose,
}) => {
  if (!targetMode) return null;

  const modeLabel = MODE_LABELS[targetMode];

  const handleConfirmSwitch = () => {
    const store = useTimerStore.getState();
    store.reset();
    store.switchMode(targetMode);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="center"
      title="Switch mode?"
      className="max-w-sm"
    >
      <div className="flex flex-col gap-5 text-center sm:text-left">
        <p className="font-sans text-body text-ink-700">
          Switch to <span className="font-semibold text-ink-900">{modeLabel}</span>? Your current
          session will be reset.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-glass-border/30">
          <PillButton variant="glass" size="md" type="button" onClick={onClose}>
            Keep going
          </PillButton>

          <PillButton
            variant="primary"
            size="md"
            type="button"
            onClick={handleConfirmSwitch}
          >
            Switch
          </PillButton>
        </div>
      </div>
    </Modal>
  );
};
