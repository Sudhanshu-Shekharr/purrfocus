import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SceneBackground } from '@/components/scenery/SceneBackground';
import { Header } from '@/components/header/Header';
import { MiniTimer } from '@/components/timer/MiniTimer';
import { ParticleCanvas } from '@/features/fx/ParticleCanvas';
import { RareEventsOverlay } from '@/features/fx/RareEventsOverlay';
import { usePrefsStore } from '@/features/prefs/store';
import { cn } from '@/lib/cn';
import { transitionBase } from '@/lib/motion';
import { useDocumentTitle, useTimerTicker, useTimerEffects } from '@/features/timer';
import { MoodPrompt } from '@/components/journal/MoodPrompt';
import { useMoodPromptStore } from '@/features/journal/moodPromptStore';

export type AppShellProps = {
  children?: React.ReactNode;
};

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const rawFocusMode = usePrefsStore(state => state.focusMode);
  const isHome = location.pathname === '/';
  const focusMode = isHome && rawFocusMode;
  const shouldReduceMotion = useReducedMotion();

  // App-level timer background ticker, document title updater and side-effect listeners
  useDocumentTitle();
  useTimerTicker();
  useTimerEffects();

  // Reflect reduced-motion state onto root html element for CSS rules
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.reduceMotion = shouldReduceMotion ? 'true' : 'false';
    }
  }, [shouldReduceMotion]);

  // Show deferred mood reflection when exiting focus mode
  React.useEffect(() => {
    if (!focusMode) {
      const deferred = useMoodPromptStore.getState().deferredSession;
      if (deferred) {
        useMoodPromptStore.getState().setPendingSession(deferred);
        useMoodPromptStore.getState().setDeferredSession(null);
      }
    }
  }, [focusMode]);

  return (
    <div
      className={cn('relative min-h-[100dvh] w-full', focusMode && 'focus-mode')}
      data-focus-mode={focusMode ? 'true' : undefined}
    >
      {/* 1. Accessible Skip link: Skip to timer on home, Skip to content on other routes */}
      <a
        href={isHome ? '#timer-card' : '#main-content'}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-toast focus:px-4 focus:py-2 focus:bg-ink-900 focus:text-surface focus:rounded-pill focus:shadow-lift focus:outline-none focus:ring-2 focus:ring-accent font-sans text-small font-medium transition-all"
      >
        {isHome ? 'Skip to timer' : 'Skip to content'}
      </a>

      {/* 2. Scenic dynamic background */}
      <SceneBackground />

      {/* 3. Global shared particle canvas layer */}
      <ParticleCanvas />

      {/* 4. Rare scenic easter eggs overlay */}
      <RareEventsOverlay />

      {/* 4. Main content frame */}
      <div className="relative min-h-[100dvh] flex flex-col justify-between z-base">
        <Header />
        <MiniTimer />

        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col focus:outline-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={shouldReduceMotion ? { duration: 0 } : transitionBase}
              className="flex-1 flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 5. Session reflection prompt */}
      <MoodPrompt />
    </div>
  );
};

export default AppShell;
