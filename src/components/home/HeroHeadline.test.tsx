import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { HeroHeadline } from './HeroHeadline';
import { resetHeroRotationForTesting } from './heroRotation';
import {
  HERO_FIRST_LINE_VARIANTS,
  HERO_ROTATION_INTERVAL_MS,
  HERO_STATIC_HEADING,
} from '@/data/hero';
import { usePrefsStore } from '@/features/prefs/store';

function getActiveVariantText(container: HTMLElement): string | null {
  const active = container.querySelector('[data-hero-line="1"] [data-active="true"]');
  return active?.textContent ?? null;
}

function setDocumentHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', {
    value: hidden,
    configurable: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('HeroHeadline', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
    resetHeroRotationForTesting();
    usePrefsStore.setState({ reduceMotion: 'system', focusMode: false });
    // Flush any debounced Zustand storage timers scheduled by test setup
    vi.runOnlyPendingTimers();
    vi.clearAllTimers();
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    resetHeroRotationForTesting();
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it('shows variant 1 initially, advances to variant 2 after 5.5s, and never repeats back-to-back across 6 advances', () => {
    const { container } = render(<HeroHeadline />);

    const seen: string[] = [];
    const initialText = getActiveVariantText(container);
    expect(initialText).toBe(HERO_FIRST_LINE_VARIANTS[0]);
    seen.push(initialText ?? '');

    for (let step = 1; step <= HERO_FIRST_LINE_VARIANTS.length; step++) {
      act(() => {
        vi.advanceTimersByTime(HERO_ROTATION_INTERVAL_MS);
      });

      const currentText = getActiveVariantText(container);
      const expected = HERO_FIRST_LINE_VARIANTS[step % HERO_FIRST_LINE_VARIANTS.length];
      expect(currentText).toBe(expected);
      expect(currentText).not.toBe(seen[seen.length - 1]);
      seen.push(currentText ?? '');
    }

    // After 1 advance (step 1) we saw variant 2; after 6 advances all 6 unique variants appeared
    expect(seen[1]).toBe(HERO_FIRST_LINE_VARIANTS[1]);
    expect(new Set(seen).size).toBe(HERO_FIRST_LINE_VARIANTS.length);
  });

  it('stacks all six variants in grid-area 1 / 1 to reserve width without reflow', () => {
    const { container } = render(<HeroHeadline />);
    const variantEls = container.querySelectorAll('[data-hero-line="1"] [data-hero-variant]');

    expect(variantEls).toHaveLength(6);
    variantEls.forEach(el => {
      expect((el as HTMLElement).style.gridArea).toBe('1 / 1');
    });
  });

  it('schedules no timers and shows variant 1 statically when OS prefers-reduced-motion is enabled', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<HeroHeadline />);

    expect(vi.getTimerCount()).toBe(0);
    expect(getActiveVariantText(container)).toBe(HERO_FIRST_LINE_VARIANTS[0]);

    act(() => {
      vi.advanceTimersByTime(HERO_ROTATION_INTERVAL_MS * 3);
    });

    expect(getActiveVariantText(container)).toBe(HERO_FIRST_LINE_VARIANTS[0]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('schedules no timers and shows variant 1 statically when Settings reduceMotion override is on', () => {
    usePrefsStore.setState({ reduceMotion: 'on' });
    vi.runOnlyPendingTimers();
    vi.clearAllTimers();

    const { container } = render(<HeroHeadline />);

    expect(vi.getTimerCount()).toBe(0);
    expect(getActiveVariantText(container)).toBe(HERO_FIRST_LINE_VARIANTS[0]);

    act(() => {
      vi.advanceTimersByTime(HERO_ROTATION_INTERVAL_MS * 2);
    });

    expect(getActiveVariantText(container)).toBe(HERO_FIRST_LINE_VARIANTS[0]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('pauses rotation while the tab is hidden and resumes when visible again', () => {
    const { container } = render(<HeroHeadline />);
    expect(getActiveVariantText(container)).toBe(HERO_FIRST_LINE_VARIANTS[0]);

    // Advance 2s into the 5.5s cycle, then hide the tab
    act(() => {
      vi.advanceTimersByTime(2000);
      setDocumentHidden(true);
    });

    expect(vi.getTimerCount()).toBe(0);

    // Wait well past 5.5s while hidden — must not rotate
    act(() => {
      vi.advanceTimersByTime(HERO_ROTATION_INTERVAL_MS * 3);
    });
    expect(getActiveVariantText(container)).toBe(HERO_FIRST_LINE_VARIANTS[0]);

    // Tab becomes visible again: 3.5s remain in the cycle
    act(() => {
      setDocumentHidden(false);
    });
    expect(vi.getTimerCount()).toBe(1);

    act(() => {
      vi.advanceTimersByTime(3400);
    });
    expect(getActiveVariantText(container)).toBe(HERO_FIRST_LINE_VARIANTS[0]);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(getActiveVariantText(container)).toBe(HERO_FIRST_LINE_VARIANTS[1]);
  });

  it('keeps the h1 accessible name static over time with aria-hidden on visible spans and no aria-live', () => {
    const { container } = render(<HeroHeadline />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveAccessibleName(HERO_STATIC_HEADING);
    expect(container.querySelector('[aria-live]')).toBeNull();
    expect(container.querySelector('[data-hero-line="1"]')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[data-hero-line="2"]')).toHaveAttribute('aria-hidden', 'true');

    // Rotate through several variants and verify the accessible name never changes
    for (let i = 0; i < 4; i++) {
      act(() => {
        vi.advanceTimersByTime(HERO_ROTATION_INTERVAL_MS);
      });
      expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(HERO_STATIC_HEADING);
    }
  });

  it('clears the active timer on unmount without leaking and preserves cycle progress across remount', () => {
    const { container, unmount } = render(<HeroHeadline />);
    expect(vi.getTimerCount()).toBe(1);

    // Advance to variant 2
    act(() => {
      vi.advanceTimersByTime(HERO_ROTATION_INTERVAL_MS);
    });
    expect(getActiveVariantText(container)).toBe(HERO_FIRST_LINE_VARIANTS[1]);

    // Unmount (e.g. route change away from Home) clears the timer
    unmount();
    expect(vi.getTimerCount()).toBe(0);

    // Remounting resumes from variant 2 instead of restarting at variant 1
    const remounted = render(<HeroHeadline />);
    expect(getActiveVariantText(remounted.container)).toBe(HERO_FIRST_LINE_VARIANTS[1]);
    expect(vi.getTimerCount()).toBe(1);

    remounted.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
