import React from 'react';
import { Flame } from 'lucide-react';
import { Eyebrow } from '@/components/ui';
import { useTimerStore } from '@/features/timer/store';
import { useCatStore } from '@/features/cat/store';
import { useStatsStore } from '@/features/stats/store';
import { calculateStreak } from '@/features/rewards/streak';
import {
  useCatRuntimeStore,
  selectDisplayedPose,
  selectEyebrow,
} from '@/features/cat/controller';
import { POSE_DESCRIPTORS } from '@/features/cat/lines';

export type CatCaptionProps = {
  className?: string;
};

export const CatEyebrow: React.FC<{ className?: string }> = ({ className = '' }) => {
  const mode = useTimerStore(s => s.mode);
  const status = useTimerStore(s => s.status);
  const { label, pulsing } = selectEyebrow(mode, status);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`h-2 w-2 rounded-full ${
          pulsing ? 'bg-success motion-safe:animate-pulse' : 'bg-ink-500'
        }`}
        aria-hidden="true"
      />
      <Eyebrow className="text-ink-700">{label}</Eyebrow>
    </div>
  );
};

export const CatCaption: React.FC<CatCaptionProps> = ({ className = '' }) => {
  const mode = useTimerStore(s => s.mode);
  const status = useTimerStore(s => s.status);
  const studyPoseVariant = useCatStore(s => s.studyPoseVariant);

  const overlay = useCatRuntimeStore(s => s.overlay);
  const isSleeping = useCatRuntimeStore(s => s.isSleeping);

  const displayedPose = selectDisplayedPose(
    overlay,
    isSleeping,
    mode,
    status,
    studyPoseVariant,
  );

  const descriptor = POSE_DESCRIPTORS[displayedPose] ?? 'a happy little cat';

  const logs = useStatsStore(s => s.logs);
  const streak = calculateStreak(logs.map(l => l.date));

  return (
    <div className={`flex items-center justify-center gap-2 flex-wrap ${className}`}>
      <p className="font-sans text-small text-ink-500 transition-opacity duration-300">
        {descriptor}
      </p>
      {streak.current >= 2 && (
        <span
          data-testid="streak-chip"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill glass border border-glass-border/40 font-sans text-micro font-medium text-accent shadow-xs"
        >
          <Flame className="h-3 w-3 fill-accent text-accent" aria-hidden="true" />
          <span>{streak.current} days in a row</span>
        </span>
      )}
    </div>
  );
};
