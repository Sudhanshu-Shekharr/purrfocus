import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard, Eyebrow } from '@/components/ui';
import { ModeTabs } from './ModeTabs';
import { TimerDigits } from './TimerDigits';
import { TimerControls } from './TimerControls';
import { SessionDots } from './SessionDots';
import { MicroCopy } from './MicroCopy';
import { ModeSwitchModal } from './ModeSwitchModal';
import { TimerAnnouncer } from './TimerAnnouncer';
import { useTimerShortcuts } from '@/features/timer/useTimerShortcuts';
import type { Mode } from '@/features/timer/types';

export const TimerCard: React.FC = () => {
  const [switchTarget, setSwitchTarget] = useState<Mode | null>(null);

  useTimerShortcuts({ onRequestSwitchConfirm: setSwitchTarget });

  return (
    <GlassCard
      id="timer-card"
      tabIndex={-1}
      padding="lg"
      className="w-full flex flex-col items-center text-center focus:outline-none"
    >
      <h2 className="sr-only">Pomodoro Timer</h2>
      <TimerAnnouncer />

      {/* 1. Mode Tabs */}
      <ModeTabs onRequestSwitchConfirm={setSwitchTarget} />

      {/* 2. Main Countdown Display (only component subscribed to remaining) */}
      <TimerDigits />

      {/* 3. Primary Timer Actions */}
      <TimerControls />

      {/* 4. Session Status & Friends Link */}
      <div className="w-full pt-6 border-t border-glass-border/40 flex flex-col items-center gap-2.5">
        <Eyebrow className="text-ink-500">ONE THING AT A TIME</Eyebrow>

        <MicroCopy />

        <SessionDots />

        <Link
          to="/rooms"
          className="font-sans text-small text-accent hover:underline underline-offset-4 focus-visible:rounded mt-1 transition-colors"
        >
          Study with friends ↗
        </Link>
      </div>

      {/* Confirm Mode Switch Modal */}
      <ModeSwitchModal
        targetMode={switchTarget}
        open={switchTarget !== null}
        onClose={() => setSwitchTarget(null)}
      />
    </GlassCard>
  );
};

export default TimerCard;
