import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from './useReducedMotion';
import { usePrefsStore } from '@/features/prefs/store';

describe('useReducedMotion', () => {
  let mockMatches = false;

  beforeEach(() => {
    usePrefsStore.setState({ reduceMotion: 'system' });
    mockMatches = false;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? mockMatches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('returns false when override is system and OS prefers normal motion', () => {
    mockMatches = false;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when override is system and OS prefers reduced motion', () => {
    mockMatches = true;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('returns true when override is "on" regardless of OS preference', () => {
    mockMatches = false;
    act(() => {
      usePrefsStore.getState().setReduceMotion('on');
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('returns false when override is "off" even if OS prefers reduced motion', () => {
    mockMatches = true;
    act(() => {
      usePrefsStore.getState().setReduceMotion('off');
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
