import React from 'react';
import { CheckSquare, Plus, Target } from 'lucide-react';
import { GlassCard, TextField, PillButton } from '@/components/ui';

export const IntentionsCardSlot: React.FC = () => {
  return (
    <GlassCard padding="md" className="h-full flex flex-col justify-between">
      {/* 1. Header with title, icon, and count pill */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-pill glass text-accent" aria-hidden="true">
              <CheckSquare className="h-4 w-4" />
            </span>
            <h2 className="font-serif text-lg font-medium text-ink-900 tracking-tight">
              Intentions
            </h2>
          </div>
          <span className="glass px-2.5 py-0.5 rounded-pill font-sans text-micro font-medium text-ink-700 border border-glass-border shadow-xs">
            0 / 0
          </span>
        </div>

        <p className="font-sans text-small text-ink-500 mb-4">
          What&apos;s on your mind for this session?
        </p>

        {/* 2. Subject field placeholder */}
        <div className="space-y-3">
          <TextField
            label="Subject or focus goal"
            placeholder="e.g. Biology Chapter 4 reading"
            disabled
            className="text-small opacity-85"
          />

          {/* 3. Add task placeholder */}
          <div className="relative">
            <TextField
              label="Add a task"
              placeholder="Add a small step..."
              disabled
              className="text-small opacity-85"
            />
            <div className="absolute right-2 top-[26px]">
              <PillButton
                variant="ghost"
                size="sm"
                disabled
                aria-label="Add task"
                className="h-7 w-7 p-0 rounded-pill opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
              </PillButton>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Soft empty state footer hint */}
      <div className="pt-4 mt-4 border-t border-glass-border/40 flex items-center justify-between text-micro text-ink-500">
        <span className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-accent" />
          <span>One intention per pomodoro</span>
        </span>
        <span className="font-medium text-ink-700">Phase 8</span>
      </div>
    </GlassCard>
  );
};

export default IntentionsCardSlot;
