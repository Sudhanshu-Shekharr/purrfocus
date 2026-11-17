import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useId,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { transitionFast } from '@/lib/motion';

type Position = { top: number; left: number; above: boolean };

function calcPosition(
  trigger: HTMLElement,
  menu: HTMLElement,
): Position {
  const tRect = trigger.getBoundingClientRect();
  const mHeight = menu.offsetHeight || 200;
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  const above = tRect.bottom + mHeight + 8 > window.innerHeight && tRect.top > mHeight + 8;

  const top = above
    ? scrollY + tRect.top - mHeight - 8
    : scrollY + tRect.bottom + 8;

  const left = Math.min(
    scrollX + tRect.left,
    scrollX + window.innerWidth - (menu.offsetWidth || 200) - 8,
  );

  return { top, left, above };
}

export type PopoverProps = {
  /** The element that opens the popover when clicked */
  trigger: React.ReactElement;
  /** Menu content — typically MenuItem components or custom dialog content */
  children: React.ReactNode | ((props: { close: () => void }) => React.ReactNode);
  className?: string;
  role?: 'menu' | 'dialog';
  ariaLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Anchored dropdown popover with:
 * - Portal rendering (to document.body)
 * - Edge-collision flipping (above/below)
 * - Arrow-key navigation between menu items (menu mode)
 * - Esc and outside-click to close
 * - Returns focus to trigger on close
 */
export function Popover({
  trigger,
  children,
  className,
  role = 'menu',
  ariaLabel = 'Options',
  open: controlledOpen,
  onOpenChange,
}: PopoverProps): React.ReactElement {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const [pos, setPos] = useState<Position>({ top: 0, left: 0, above: false });
  const triggerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const setOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const nextValue = typeof next === 'function' ? next(open) : next;
      if (!isControlled) {
        setUncontrolledOpen(nextValue);
      }
      onOpenChange?.(nextValue);
    },
    [isControlled, open, onOpenChange],
  );

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to trigger after portal closes
    setTimeout(() => triggerRef.current?.focus(), 10);
  }, [setOpen]);

  useOnClickOutside(menuRef, () => {
    if (open) close();
  }, open);

  // Close on Escape anywhere in document
  useEffect(() => {
    if (!open) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [open, close]);

  // Position on open
  useEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return;
    setPos(calcPosition(triggerRef.current, menuRef.current));
  }, [open]);

  // Keyboard navigation inside the popover
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (role === 'dialog') {
        if (e.key === 'Escape') {
          e.preventDefault();
          close();
        }
        return;
      }

      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [],
      );
      if (items.length === 0) return;
      const current = document.activeElement;
      const idx = items.indexOf(current as HTMLElement);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          (items[(idx + 1) % items.length] as HTMLElement).focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          (items[(idx - 1 + items.length) % items.length] as HTMLElement).focus();
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'Tab':
          close();
          break;
        default:
          break;
      }
    },
    [role, close],
  );

  // Focus first item when opened (menu mode only)
  useEffect(() => {
    if (!open || role !== 'menu') return;
    const first = menuRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([disabled])',
    );
    setTimeout(() => first?.focus(), 50);
  }, [open, role]);

  const triggerEl = React.cloneElement(trigger, {
    ref: triggerRef,
    onClick: (e: React.MouseEvent) => {
      trigger.props.onClick?.(e);
      setOpen(prev => !prev);
    },
    'aria-haspopup': role === 'dialog' ? 'dialog' : 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
  });

  const content = typeof children === 'function' ? children({ close }) : children;

  return (
    <>
      {triggerEl}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              id={menuId}
              role={role}
              aria-label={ariaLabel}
              initial={{ opacity: 0, scale: 0.96, y: pos.above ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: pos.above ? 4 : -4 }}
              transition={transitionFast}
              onKeyDown={handleKeyDown}
              style={{
                position: 'absolute',
                top: pos.top,
                left: pos.left,
                zIndex: 'var(--z-popover)',
              }}
              className={cn(
                'glass-strong min-w-[180px] rounded-card p-1.5 shadow-pop',
                className,
              )}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
