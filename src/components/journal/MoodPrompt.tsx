import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Check } from 'lucide-react';
import { useMoodPromptStore } from '@/features/journal/moodPromptStore';
import { useStatsStore } from '@/features/stats/store';
import { PillButton } from '@/components/ui/PillButton';
import { transitionBase } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

const MOODS: readonly { score: 1 | 2 | 3 | 4 | 5; emoji: string; label: string }[] = [
  { score: 1, emoji: '😴', label: 'Tired' },
  { score: 2, emoji: '😐', label: 'Okay' },
  { score: 3, emoji: '🙂', label: 'Good' },
  { score: 4, emoji: '😊', label: 'Great' },
  { score: 5, emoji: '🌟', label: 'Energized' },
];

export const MoodPrompt: React.FC = () => {
  const pendingSession = useMoodPromptStore(s => s.pendingSession);
  const dismiss = useMoodPromptStore(s => s.dismiss);
  const updateSessionMoodNote = useStatsStore(s => s.updateSessionMoodNote);
  const reducedMotion = useReducedMotion();

  const [selectedMood, setSelectedMood] = useState<1 | 2 | 3 | 4 | 5 | undefined>(undefined);
  const [note, setNote] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  // Auto-dismiss after 30s unless user interacted
  useEffect(() => {
    if (!pendingSession || hasInteracted) return;

    const timeout = setTimeout(() => {
      dismiss();
    }, 30000);

    return () => clearTimeout(timeout);
  }, [pendingSession, hasInteracted, dismiss]);

  // Reset local state whenever pendingSession changes
  useEffect(() => {
    if (pendingSession) {
      setSelectedMood(undefined);
      setNote('');
      setHasInteracted(false);
    }
  }, [pendingSession]);

  // Escape key closes prompt
  useEffect(() => {
    if (!pendingSession) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingSession, dismiss]);

  const handleSave = () => {
    if (!pendingSession) return;
    updateSessionMoodNote(
      pendingSession.sessionId,
      selectedMood,
      note.trim() ? note.trim() : undefined,
    );
    dismiss();
  };

  const handleMoodSelect = (score: 1 | 2 | 3 | 4 | 5) => {
    setHasInteracted(true);
    setSelectedMood(prev => (prev === score ? undefined : score));
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasInteracted(true);
    setNote(e.target.value.slice(0, 140));
  };

  return (
    <AnimatePresence>
      {pendingSession && (
        <motion.aside
          role="region"
          aria-label="Session reflection"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
          transition={transitionBase}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-modal max-w-sm w-[calc(100vw-2rem)] glass-strong shadow-pop rounded-card border border-glass-border p-4 flex flex-col gap-3 text-ink-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-accent">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span className="font-sans text-micro font-medium uppercase tracking-wider">
                {pendingSession.minutes}m focus complete
              </span>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss reflection"
              className="text-ink-500 hover:text-ink-900 p-1 -mr-1 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div>
            <h2 className="font-serif text-title text-ink-900">How did that feel?</h2>
          </div>

          {/* Mood 5-point buttons */}
          <div className="flex items-center justify-between gap-1">
            {MOODS.map(m => {
              const isSelected = selectedMood === m.score;
              return (
                <button
                  key={m.score}
                  type="button"
                  onClick={() => handleMoodSelect(m.score)}
                  aria-label={`${m.label} (mood ${m.score})`}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex flex-col items-center gap-1 py-1.5 px-2 rounded-btn transition-all text-small',
                    'hover:bg-glass border border-transparent',
                    isSelected
                      ? 'bg-accent/15 border-accent text-ink-900 scale-105 shadow-sm'
                      : 'text-ink-700 opacity-80 hover:opacity-100',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                  )}
                >
                  <span className="text-xl" role="img" aria-hidden="true">
                    {m.emoji}
                  </span>
                  <span className="text-[10px] font-sans font-medium">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Optional Note input */}
          <div className="flex flex-col gap-1">
            <div className="relative">
              <input
                type="text"
                value={note}
                onChange={handleNoteChange}
                placeholder="Add a quiet note (optional)..."
                maxLength={140}
                className="w-full rounded-pill border border-glass-border bg-glass px-3.5 py-1.5 font-sans text-small text-ink-900 shadow-glass placeholder:text-ink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              />
              {note.length > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-sans text-ink-500 tabular-nums">
                  {note.length}/140
                </span>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <PillButton
              variant="ghost"
              size="sm"
              onClick={dismiss}
              aria-label="Skip reflection"
            >
              Skip
            </PillButton>
            <PillButton
              variant="primary"
              size="sm"
              leftIcon={<Check className="h-3.5 w-3.5" />}
              onClick={handleSave}
              disabled={selectedMood === undefined && !note.trim()}
              aria-label="Save reflection"
            >
              Save
            </PillButton>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
