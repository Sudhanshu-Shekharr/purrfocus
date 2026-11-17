import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { useTimerStore } from '@/features/timer/store';
import { usePrefsStore } from '@/features/prefs/store';
import { useIsMobile, useReducedMotion } from '@/hooks';
import { formatClock } from '@/lib/time';
import { cn } from '@/lib/cn';
import type { Mode } from '@/features/timer/types';

const modeLabels: Record<Mode, string> = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
};

const modeDotColors: Record<Mode, string> = {
  focus: 'bg-accent',
  shortBreak: 'bg-success',
  longBreak: 'bg-warning',
};

export const MiniTimer: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  const isHome = location.pathname === '/';
  const focusMode = usePrefsStore(s => s.focusMode);

  const mode = useTimerStore(s => s.mode);
  const remaining = useTimerStore(s => s.remaining);
  const status = useTimerStore(s => s.status);
  const pause = useTimerStore(s => s.pause);
  const resume = useTimerStore(s => s.resume);
  const start = useTimerStore(s => s.start);

  const [isTimerCardVisible, setIsTimerCardVisible] = useState(true);

  useEffect(() => {
    if (!isHome || typeof window === 'undefined') return;

    const timerCard = document.getElementById('timer-card');
    if (!timerCard) return;

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry) {
          setIsTimerCardVisible(entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );

    observer.observe(timerCard);
    return () => observer.disconnect();
  }, [isHome]);

  // Only show when on home, on mobile screen, timer card scrolled out, and NOT in focus mode
  const shouldShow = isHome && isMobile && !isTimerCardVisible && !focusMode;

  const handleScrollToTimer = () => {
    const timerCard = document.getElementById('timer-card');
    timerCard?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  };

  const handleToggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'running') {
      pause();
    } else if (status === 'paused') {
      resume();
    } else {
      start();
    }
  };

  const isRunning = status === 'running';

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          role="region"
          aria-label="Sticky timer"
          aria-live="off"
          initial={prefersReducedMotion ? { opacity: 1 } : { y: -48, opacity: 0 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { y: -48, opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
          onClick={handleScrollToTimer}
          className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-12 glass-strong border-b border-glass-border shadow-md cursor-pointer select-none"
        >
          {/* Left: Mode indicator & label */}
          <div className="flex items-center gap-2">
            <span
              className={cn('h-2 w-2 rounded-full shrink-0', modeDotColors[mode])}
              aria-hidden="true"
            />
            <span className="font-sans text-micro font-medium uppercase tracking-wider text-ink-700">
              {modeLabels[mode]}
            </span>
          </div>

          {/* Center: Tabular time digits */}
          <div className="font-serif text-lg font-medium tabular-nums text-ink-900 tracking-tight">
            {formatClock(remaining)}
          </div>

          {/* Right: Pause/Resume toggle button (>= 44x44 tap target) */}
          <button
            type="button"
            onClick={handleToggleTimer}
            aria-label={isRunning ? 'Pause timer' : 'Resume timer'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-pill text-ink-900 hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            {isRunning ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MiniTimer;
