import { create } from 'zustand';
import type { Mode, Status } from '@/features/timer/types';
import { useTimerStore } from '@/features/timer/store';
import { subscribeTimerEvents } from '@/features/timer/events';
import type { CatOverlay, Mood, OverlayType, PoseId } from './types';
import {
  COOLDOWNS,
  IDLE_SLEEPY_MS,
  OVERLAY_DURATIONS,
  THOUGHT_BUBBLE_ROTATION,
} from './constants';
import {
  canTriggerOverlay,
  deriveBasePose,
  isPlayAllowed,
  shouldShowSadGentle,
} from './machine';
import { useCatStore } from './store';
import { playPopSfx, playPurrSfx, playRustleSfx } from './sfx';
import { getCatLines, type CatDialogueContext } from './lines';
import { getTimeOfDayGreetingContext, pickLineWithWindow } from './pickLine';
import { emitPetHearts, emitTreatSparkles, emitCelebratePetals } from '@/features/fx/emitters';
import { checkWelcomeBackMoment } from '@/features/rewards/welcome';
import { subscribeIntention } from '@/features/intentions/events';

export type CatRuntimeState = {
  overlay: CatOverlay | null;
  isSleeping: boolean;
  currentLine: string;
  recentLines: string[];
  cooldowns: {
    pet: number;
    treat: number;
    play: number;
    deskTap?: number;
  };
  stretchRemaining: number | null;
  playActive: boolean;

  // Actions
  pet: (now?: number) => boolean;
  treat: (now?: number) => boolean;
  stretch: (now?: number) => boolean;
  play: (now?: number) => boolean;
  deskTap: (now?: number) => boolean;
  stopPlay: () => void;
  cycleStudyPose: () => void;
  setBubbleLine: (line: string) => void;
  handleUserActivity: (now?: number) => void;
  resetRuntime: () => void;
};

// Internal controller timers
let overlayTimeoutId: ReturnType<typeof setTimeout> | null = null;
let stretchIntervalId: ReturnType<typeof setInterval> | null = null;
let idleSleepyTimeoutId: ReturnType<typeof setTimeout> | null = null;
let bubbleRotationTimeoutId: ReturnType<typeof setTimeout> | null = null;
let timerEventsUnsubscribe: (() => void) | null = null;
let timerStoreUnsubscribe: (() => void) | null = null;
let intentionsUnsubscribe: (() => void) | null = null;

let lastTimerStatus: Status = 'idle';
let lastTimerMode: Mode = 'focus';
let isControllerInitialized = false;

function clearAllInternalTimers(): void {
  if (overlayTimeoutId !== null) {
    clearTimeout(overlayTimeoutId);
    overlayTimeoutId = null;
  }
  if (stretchIntervalId !== null) {
    clearInterval(stretchIntervalId);
    stretchIntervalId = null;
  }
  if (idleSleepyTimeoutId !== null) {
    clearTimeout(idleSleepyTimeoutId);
    idleSleepyTimeoutId = null;
  }
  if (bubbleRotationTimeoutId !== null) {
    clearTimeout(bubbleRotationTimeoutId);
    bubbleRotationTimeoutId = null;
  }
}

export function selectDisplayedPose(
  overlay: CatOverlay | null,
  isSleeping: boolean,
  mode: Mode,
  status: Status,
  studyPoseVariant: 0 | 1 | 2,
  now: number = Date.now(),
): PoseId {
  if (overlay && overlay.until > now) {
    return overlay.pose;
  }
  return deriveBasePose({ mode, status, studyPoseVariant }, isSleeping);
}

export function selectMood(
  displayedPose: PoseId,
  mode: Mode,
  status: Status,
): Mood {
  if (displayedPose === 'celebrate') return 'proud';
  if (displayedPose === 'pet_happy') return 'happy';
  if (displayedPose === 'sleepy') return 'sleepy';
  if (mode === 'focus' && status === 'running') return 'focused';
  if (mode === 'shortBreak' || mode === 'longBreak') return 'cozy';
  return 'happy';
}

export function selectEyebrow(
  mode: Mode,
  status: Status,
): { label: string; pulsing: boolean } {
  if (status === 'running' || status === 'paused') {
    if (mode === 'focus') {
      return { label: 'STUDYING TOGETHER', pulsing: status === 'running' };
    }
    return { label: 'TAKING A BREAK', pulsing: status === 'running' };
  }
  return { label: 'READY WHEN YOU ARE', pulsing: false };
}

function getRandomBubbleDelay(): number {
  const min = THOUGHT_BUBBLE_ROTATION.minIntervalMs;
  const max = THOUGHT_BUBBLE_ROTATION.maxIntervalMs;
  return Math.floor(min + Math.random() * (max - min));
}

function updateLine(context: CatDialogueContext): void {
  const pool = getCatLines(context);
  const state = useCatRuntimeStore.getState();
  const result = pickLineWithWindow(pool, state.recentLines);
  if (!result.line) return;

  useCatRuntimeStore.setState({
    currentLine: result.line,
    recentLines: result.updatedRecent,
  });
}

function scheduleNextBubbleRotation(): void {
  if (bubbleRotationTimeoutId !== null) {
    clearTimeout(bubbleRotationTimeoutId);
  }

  const delay = getRandomBubbleDelay();
  bubbleRotationTimeoutId = setTimeout(() => {
    const runtime = useCatRuntimeStore.getState();
    const timer = useTimerStore.getState();

    // If an interaction overlay is currently active, wait before rotating
    if (!runtime.overlay || runtime.overlay.until <= Date.now()) {
      let context: CatDialogueContext = 'idle';

      if (runtime.isSleeping) {
        context = 'sleepy';
      } else if (timer.status === 'running' && timer.mode === 'focus') {
        context = 'focus';
      } else if (timer.mode === 'shortBreak' || timer.mode === 'longBreak') {
        context = 'break';
      } else {
        const greeting = getTimeOfDayGreetingContext();
        // 25% chance to show greeting if available
        if (greeting && Math.random() < 0.25) {
          context = greeting;
        } else {
          context = 'idle';
        }
      }

      updateLine(context);
    }

    scheduleNextBubbleRotation();
  }, delay);
}

function armIdleSleepyTimer(): void {
  if (idleSleepyTimeoutId !== null) {
    clearTimeout(idleSleepyTimeoutId);
    idleSleepyTimeoutId = null;
  }

  const timer = useTimerStore.getState();
  if (timer.status !== 'idle') return;

  idleSleepyTimeoutId = setTimeout(() => {
    useCatRuntimeStore.setState({ isSleeping: true });
    updateLine('sleepy');
  }, IDLE_SLEEPY_MS);
}

function setOverlayWithDuration(
  type: OverlayType,
  pose: PoseId,
  duration: number,
  now: number = Date.now(),
): void {
  if (overlayTimeoutId !== null) {
    clearTimeout(overlayTimeoutId);
    overlayTimeoutId = null;
  }

  const until = now + duration;
  useCatRuntimeStore.setState({
    overlay: { type, pose, until },
  });

  overlayTimeoutId = setTimeout(() => {
    const current = useCatRuntimeStore.getState().overlay;
    if (current && current.type === type) {
      useCatRuntimeStore.setState({ overlay: null });
    }
  }, duration);
}

export const useCatRuntimeStore = create<CatRuntimeState>()((set, get) => ({
  overlay: null,
  isSleeping: false,
  currentLine: 'ready whenever you are.',
  recentLines: ['ready whenever you are.'],
  cooldowns: {
    pet: 0,
    treat: 0,
    play: 0,
  },
  stretchRemaining: null,
  playActive: false,

  pet: (now: number = Date.now()) => {
    const state = get();
    if (now - state.cooldowns.pet < COOLDOWNS.pet) {
      return false;
    }

    const activeOverlayType =
      state.overlay && state.overlay.until > now ? state.overlay.type : null;
    if (!canTriggerOverlay(activeOverlayType, 'pet_happy')) {
      return false;
    }

    set({
      cooldowns: { ...state.cooldowns, pet: now },
      isSleeping: false,
    });

    setOverlayWithDuration('pet_happy', 'pet_happy', OVERLAY_DURATIONS.pet_happy, now);
    useCatStore.getState().awardInteractionBond('pet', now);
    playPurrSfx();
    emitPetHearts();
    updateLine('pet');
    armIdleSleepyTimer();
    return true;
  },

  treat: (now: number = Date.now()) => {
    const state = get();
    if (now - state.cooldowns.treat < COOLDOWNS.treat) {
      return false;
    }

    const activeOverlayType =
      state.overlay && state.overlay.until > now ? state.overlay.type : null;
    if (!canTriggerOverlay(activeOverlayType, 'treat')) {
      return false;
    }

    set({
      cooldowns: { ...state.cooldowns, treat: now },
      isSleeping: false,
    });

    setOverlayWithDuration('treat', 'treat', OVERLAY_DURATIONS.treat, now);
    useCatStore.getState().awardInteractionBond('treat', now);
    playPopSfx();
    emitTreatSparkles();
    updateLine('treat');
    armIdleSleepyTimer();
    return true;
  },

  stretch: (now: number = Date.now()) => {
    const state = get();
    const activeOverlayType =
      state.overlay && state.overlay.until > now ? state.overlay.type : null;
    if (!canTriggerOverlay(activeOverlayType, 'stretch')) {
      return false;
    }

    if (stretchIntervalId !== null) {
      clearInterval(stretchIntervalId);
      stretchIntervalId = null;
    }

    set({
      isSleeping: false,
      stretchRemaining: 10,
    });

    setOverlayWithDuration('stretch', 'stretch', OVERLAY_DURATIONS.stretch, now);
    useCatStore.getState().awardInteractionBond('stretch', now);
    updateLine('stretch');
    armIdleSleepyTimer();

    // 10s countdown interval
    stretchIntervalId = setInterval(() => {
      const remaining = get().stretchRemaining;
      if (remaining === null || remaining <= 1) {
        if (stretchIntervalId !== null) {
          clearInterval(stretchIntervalId);
          stretchIntervalId = null;
        }
        set({ stretchRemaining: null });
      } else {
        set({ stretchRemaining: remaining - 1 });
      }
    }, 1000);

    return true;
  },

  play: (now: number = Date.now()) => {
    const timer = useTimerStore.getState();
    if (!isPlayAllowed(timer.status, timer.mode)) {
      updateLine('playBlockedFocus');
      return false;
    }

    const state = get();
    if (now - state.cooldowns.play < COOLDOWNS.play) {
      return false;
    }

    const activeOverlayType =
      state.overlay && state.overlay.until > now ? state.overlay.type : null;
    if (!canTriggerOverlay(activeOverlayType, 'play')) {
      return false;
    }

    set({
      cooldowns: { ...state.cooldowns, play: now },
      isSleeping: false,
      playActive: true,
    });

    setOverlayWithDuration('play', 'play', OVERLAY_DURATIONS.play, now);
    playRustleSfx();
    updateLine('play');
    armIdleSleepyTimer();
    return true;
  },

  stopPlay: () => {
    const current = get().overlay;
    if (current && current.type === 'play') {
      if (overlayTimeoutId !== null) {
        clearTimeout(overlayTimeoutId);
        overlayTimeoutId = null;
      }
      set({ overlay: null, playActive: false });
    } else {
      set({ playActive: false });
    }
  },

  deskTap: (now: number = Date.now()) => {
    const state = get();
    const lastTap = state.cooldowns.deskTap ?? 0;
    if (now - lastTap < COOLDOWNS.pet) {
      return false;
    }

    set({
      cooldowns: { ...state.cooldowns, deskTap: now },
      isSleeping: false,
    });

    playPopSfx();
    updateLine('deskTap');
    armIdleSleepyTimer();
    return true;
  },

  cycleStudyPose: () => {
    useCatStore.getState().cycleStudyPoseVariant();
  },

  setBubbleLine: (line: string) => {
    set({ currentLine: line });
  },

  handleUserActivity: () => {
    const state = get();
    if (state.isSleeping) {
      set({ isSleeping: false });
      updateLine('wake');
    }
    armIdleSleepyTimer();
  },

  resetRuntime: () => {
    clearAllInternalTimers();
    set({
      overlay: null,
      isSleeping: false,
      currentLine: 'ready whenever you are.',
      recentLines: ['ready whenever you are.'],
      cooldowns: { pet: 0, treat: 0, play: 0 },
      stretchRemaining: null,
      playActive: false,
    });
  },
}));

/**
 * Initialize controller event listeners and background timers.
 * Can be safely called multiple times; returns cleanup function.
 */
export function initCatController(): () => void {
  if (isControllerInitialized) {
    return destroyCatController;
  }
  isControllerInitialized = true;

  // Track initial timer state
  const initialTimer = useTimerStore.getState();
  lastTimerStatus = initialTimer.status;
  lastTimerMode = initialTimer.mode;

  // Subscribe to timer state changes
  timerStoreUnsubscribe = useTimerStore.subscribe(state => {
    const prevStatus = lastTimerStatus;
    lastTimerStatus = state.status;
    lastTimerMode = state.mode;

    if (state.status === 'idle' && prevStatus !== 'idle') {
      armIdleSleepyTimer();
    } else if (state.status !== 'idle') {
      if (idleSleepyTimeoutId !== null) {
        clearTimeout(idleSleepyTimeoutId);
        idleSleepyTimeoutId = null;
      }
      if (useCatRuntimeStore.getState().isSleeping) {
        useCatRuntimeStore.setState({ isSleeping: false });
      }
    }
  });

  // Subscribe to timer events
  timerEventsUnsubscribe = subscribeTimerEvents(event => {
    const now = Date.now();

    if (event.type === 'start') {
      useCatRuntimeStore.setState({ isSleeping: false });
      armIdleSleepyTimer();
      if (event.mode === 'focus') {
        updateLine('focus');
      }
    } else if (event.type === 'finish') {
      if (event.mode === 'focus') {
        // Award focus bond (+1 per minute)
        const focusMinutes = Math.round(useTimerStore.getState().durations.focus / 60);
        useCatStore.getState().addBond(focusMinutes);

        // Trigger celebrate overlay (3s) and falling confetti-lite petals
        setOverlayWithDuration('celebrate', 'celebrate', OVERLAY_DURATIONS.celebrate, now);
        emitCelebratePetals();
        updateLine('complete');
      }
    } else if (event.type === 'reset') {
      if (shouldShowSadGentle(lastTimerStatus, lastTimerMode)) {
        setOverlayWithDuration('sad_gentle', 'sad_gentle', OVERLAY_DURATIONS.sad_gentle, now);
        updateLine('reset');
      }
      armIdleSleepyTimer();
    } else if (event.type === 'recovered') {
      if (event.mode === 'focus') {
        const focusMinutes = Math.round(useTimerStore.getState().durations.focus / 60);
        useCatStore.getState().addBond(focusMinutes);
      }
    }
  });

  // Subscribe to intentions events (e.g. task done celebration)
  intentionsUnsubscribe = subscribeIntention(event => {
    if (event.type === 'taskDone') {
      updateLine('taskDone');
    }
  });

  // Check for welcome-back moment on return day
  checkWelcomeBackMoment();

  // Start timers
  armIdleSleepyTimer();
  scheduleNextBubbleRotation();

  return destroyCatController;
}

export function destroyCatController(): void {
  isControllerInitialized = false;
  clearAllInternalTimers();

  if (timerEventsUnsubscribe) {
    timerEventsUnsubscribe();
    timerEventsUnsubscribe = null;
  }
  if (timerStoreUnsubscribe) {
    timerStoreUnsubscribe();
    timerStoreUnsubscribe = null;
  }
  if (intentionsUnsubscribe) {
    intentionsUnsubscribe();
    intentionsUnsubscribe = null;
  }
}
