import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimerStore } from '@/features/timer/store';
import { usePrefsStore } from '@/features/prefs/store';
import { useSceneryStore } from '@/features/scenery/store';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { birdChirp } from '@/features/audio/sfx';
import {
  shouldTriggerRareEvent,
  RARE_EVENT_CONSTANTS,
  type RareEventType,
} from './rareEvents';

const ButterflyGraphic: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-amber-400/80 drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)] motion-safe:animate-pulse"
    aria-hidden="true"
  >
    <path d="M12 12C9 7 4 6 2 9c-2 3 0 7 4 7 3 0 5-3 6-4zm0 0c3-5 8-6 10-3 2 3 0 7-4 7-3 0-5-3-6-4zm0 0c-2 2-3 5-1 7 2 2 4 0 4-3 0-2-1-3-3-4zm0 0c2 2 3 5 1 7-2 2-4 0-4-3 0-2 1-3 3-4z" />
  </svg>
);

const LeafGraphic: React.FC<{ variant?: number }> = ({ variant = 0 }) => {
  const colors = [
    'text-amber-600/70',
    'text-orange-500/70',
    'text-emerald-700/60',
    'text-yellow-600/70',
  ];
  const color = colors[variant % colors.length];

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${color} drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]`}
      aria-hidden="true"
    >
      <path d="M17 8C8 10 5 16 3 21c5-2 11-5 13-14 3-1 5 1 5 1s-1-3-4-0zM3 21c2-3 5-6 9-8" />
    </svg>
  );
};

const BirdGraphic: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-ink-800/85 drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
    aria-hidden="true"
  >
    <path d="M12 2C8 2 5 5 5 8c0 2 1 4 2 5L4 21l8-4 5 1c2-2 3-5 3-8 0-4-3-8-8-8zm-2 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
  </svg>
);

export const RareEventsOverlay: React.FC = () => {
  const timerStatus = useTimerStore(s => s.status);
  const timerMode = useTimerStore(s => s.mode);
  const rareEventsOn = usePrefsStore(s => s.rareEventsOn);
  const focusMode = usePrefsStore(s => s.focusMode);
  const activeSceneId = useSceneryStore(s => s.activeSceneId);
  const prefersReducedMotion = useReducedMotion();

  const [activeEvent, setActiveEvent] = useState<RareEventType | null>(null);
  const lastEventTimeRef = useRef<number>(0);
  const activeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCurrentEvent = useCallback(() => {
    if (activeTimeoutRef.current !== null) {
      clearTimeout(activeTimeoutRef.current);
      activeTimeoutRef.current = null;
    }
    setActiveEvent(null);
  }, []);

  // Quiet Focus Rule & Reduced Motion: cancel any active event immediately
  useEffect(() => {
    if (
      (((timerStatus === 'running' && timerMode === 'focus') || focusMode || prefersReducedMotion)) &&
      activeEvent !== null
    ) {
      clearCurrentEvent();
    }
  }, [timerStatus, timerMode, focusMode, prefersReducedMotion, activeEvent, clearCurrentEvent]);

  // Periodic scheduler: evaluates every 90 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (typeof window === 'undefined' || prefersReducedMotion) return;

      const triggered = shouldTriggerRareEvent({
        timerStatus,
        timerMode,
        rareEventsOn,
        reducedMotion: prefersReducedMotion,
        hasActiveEvent: activeEvent !== null,
        lastEventTime: lastEventTimeRef.current,
        now: Date.now(),
        randomValue: Math.random(),
        sceneId: activeSceneId,
        focusMode,
      });

      if (!triggered) return;

      lastEventTimeRef.current = Date.now();
      setActiveEvent(triggered);

      if (triggered === 'birdChirp') {
        birdChirp();
      }

      const duration = RARE_EVENT_CONSTANTS.DURATIONS_MS[triggered];
      if (activeTimeoutRef.current !== null) {
        clearTimeout(activeTimeoutRef.current);
      }
      activeTimeoutRef.current = setTimeout(() => {
        setActiveEvent(null);
        activeTimeoutRef.current = null;
      }, duration);
    }, RARE_EVENT_CONSTANTS.CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      if (activeTimeoutRef.current !== null) {
        clearTimeout(activeTimeoutRef.current);
      }
    };
  }, [activeEvent, timerStatus, timerMode, rareEventsOn, activeSceneId, focusMode, prefersReducedMotion]);

  return (
    <div
      data-testid="rare-events-overlay"
      className="fixed inset-0 pointer-events-none z-30 overflow-hidden"
      aria-hidden="true"
    >
      <AnimatePresence>
        {activeEvent === 'butterfly' && (
          <motion.div
            key="rare-butterfly"
            initial={{ x: '-5vw', y: '65vh', opacity: 0 }}
            animate={{
              x: '105vw',
              y: ['65vh', '48vh', '58vh', '38vh', '45vh', '25vh'],
              opacity: [0, 0.9, 0.9, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 10,
              ease: 'easeInOut',
            }}
            className="absolute will-change-transform"
          >
            <ButterflyGraphic />
          </motion.div>
        )}

        {activeEvent === 'leafDrift' && (
          <motion.div key="rare-leaf-drift" className="absolute inset-0">
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{
                  x: `${15 + i * 20}vw`,
                  y: '-8vh',
                  rotate: 0,
                  opacity: 0,
                }}
                animate={{
                  x: `${35 + i * 22}vw`,
                  y: '108vh',
                  rotate: 360 * (i % 2 === 0 ? 1 : -1),
                  opacity: [0, 0.85, 0.85, 0],
                }}
                transition={{
                  duration: 8,
                  delay: i * 0.9,
                  ease: 'easeInOut',
                }}
                className="absolute will-change-transform"
              >
                <LeafGraphic variant={i} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeEvent === 'birdChirp' && (
          <motion.div
            key="rare-bird-chirp"
            initial={{ y: -40, opacity: 0, scale: 0.9 }}
            animate={{
              y: 0,
              opacity: [0, 0.95, 0.95, 0],
              scale: 1,
            }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 4,
              times: [0, 0.1, 0.85, 1],
              ease: 'easeOut',
            }}
            className="absolute top-16 right-8 will-change-transform"
          >
            <BirdGraphic />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
