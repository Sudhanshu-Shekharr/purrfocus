import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useId,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { transitionBase } from '@/lib/motion';

// ── Types ──────────────────────────────────────────────────────────────────

export type ToastTone = 'default' | 'success' | 'warning' | 'danger';

export type ShowToastOptions = {
  message: string;
  tone?: ToastTone;
  /** Auto-dismiss delay in ms. Default: 4000 */
  duration?: number;
};

type ToastEntry = {
  id: string;
  message: string;
  tone: ToastTone;
  duration: number;
};

type ToastContextValue = {
  show: (opts: ShowToastOptions) => void;
};

// ── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Tone styling ───────────────────────────────────────────────────────────

const toneBarMap: Record<ToastTone, string> = {
  default: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

const toneTextMap: Record<ToastTone, string> = {
  default: 'text-ink-900',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

// ── Single Toast ───────────────────────────────────────────────────────────

type ToastItemProps = {
  toast: ToastEntry;
  onDismiss: (id: string) => void;
};

function ToastItem({ toast, onDismiss }: ToastItemProps): React.ReactElement {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), toast.duration);
  }, [toast.id, toast.duration, onDismiss]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  React.useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.95 }}
      transition={transitionBase}
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      className={cn(
        'glass-strong flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-card p-4 shadow-pop',
      )}
    >
      {/* Tone accent bar */}
      <span
        aria-hidden="true"
        className={cn('mt-0.5 h-4 w-1 shrink-0 rounded-pill', toneBarMap[toast.tone])}
      />

      {/* Message */}
      <p className={cn('flex-1 font-sans text-body', toneTextMap[toast.tone])}>
        {toast.message}
      </p>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className={cn(
          '-mt-1 -mr-1 rounded-full p-1.5',
          'text-ink-500 transition-colors duration-fast ease-soft',
          'hover:bg-glass hover:text-ink-900',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
        )}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </motion.li>
  );
}

// ── Provider ───────────────────────────────────────────────────────────────

export type ToastProviderProps = {
  children: React.ReactNode;
};

/**
 * Wrap the app with `ToastProvider` to enable `useToast()` anywhere in the tree.
 * Renders a portal at the bottom-center of the viewport.
 */
export function ToastProvider({ children }: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const regionId = useId();

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((opts: ShowToastOptions) => {
    const entry: ToastEntry = {
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      message: opts.message,
      tone: opts.tone ?? 'default',
      duration: opts.duration ?? 4000,
    };
    setToasts(prev => [...prev, entry]);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div
          role="region"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Notifications"
          id={regionId}
          className="pointer-events-none fixed bottom-6 left-1/2 z-toast flex -translate-x-1/2 flex-col items-center gap-2"
        >
          <ul className="pointer-events-auto flex flex-col items-center gap-2 list-none p-0 m-0">
            <AnimatePresence mode="popLayout">
              {toasts.map(t => (
                <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
              ))}
            </AnimatePresence>
          </ul>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * Returns the `show` function to imperatively display toasts.
 * Must be used inside `ToastProvider`.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}
