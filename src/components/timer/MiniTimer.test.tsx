import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MiniTimer } from './MiniTimer';
import { useTimerStore } from '@/features/timer/store';
import { usePrefsStore } from '@/features/prefs/store';

describe('MiniTimer', () => {
  let intersectCallback: (entries: Array<{ isIntersecting: boolean }>) => void;

  beforeEach(() => {
    usePrefsStore.setState({ focusMode: false });
    useTimerStore.setState({
      status: 'running',
      remaining: 1500,
      endsAt: Date.now() + 1500 * 1000,
      mode: 'focus',
    });

    // Mock mobile screen with full matchMedia mock (including addListener for framer-motion)
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width: 767px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Mock IntersectionObserver
    window.IntersectionObserver = vi.fn().mockImplementation(cb => {
      intersectCallback = cb;
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    });

    // Create a mock timer-card element in DOM
    const timerCard = document.createElement('div');
    timerCard.id = 'timer-card';
    timerCard.scrollIntoView = vi.fn();
    document.body.appendChild(timerCard);

    return () => {
      timerCard.remove();
    };
  });

  it('does not render when timer card is visible', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <MiniTimer />
      </MemoryRouter>,
    );

    // Initial state is visible
    expect(screen.queryByRole('region', { name: /sticky timer/i })).not.toBeInTheDocument();
  });

  it('renders sticky bar when timer card scrolls out of view on mobile', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <MiniTimer />
      </MemoryRouter>,
    );

    // Simulate timer card scrolling out of view
    act(() => {
      intersectCallback([{ isIntersecting: false }]);
    });

    const miniTimer = screen.getByRole('region', { name: /sticky timer/i });
    expect(miniTimer).toBeInTheDocument();
    expect(miniTimer).toHaveAttribute('aria-live', 'off');

    // Displays mode and remaining time
    expect(miniTimer).toHaveTextContent(/focus/i);
    expect(miniTimer).toHaveTextContent('25:00');

    // Pause button has min-h-[44px]
    const toggleButton = screen.getByRole('button', { name: /pause timer/i });
    expect(toggleButton).toHaveClass('min-h-[44px]');
  });

  it('scrolls real timer into view when sticky bar is tapped', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <MiniTimer />
      </MemoryRouter>,
    );

    act(() => {
      intersectCallback([{ isIntersecting: false }]);
    });

    const miniTimer = screen.getByRole('region', { name: /sticky timer/i });
    const timerCard = document.getElementById('timer-card')!;

    fireEvent.click(miniTimer);
    expect(timerCard.scrollIntoView).toHaveBeenCalled();
  });

  it('clicking toggle button pauses/resumes timer without triggering scroll', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <MiniTimer />
      </MemoryRouter>,
    );

    act(() => {
      intersectCallback([{ isIntersecting: false }]);
    });

    const timerCard = document.getElementById('timer-card')!;
    const toggleButton = screen.getByRole('button', { name: /pause timer/i });

    fireEvent.click(toggleButton);

    expect(useTimerStore.getState().status).toBe('paused');
    expect(timerCard.scrollIntoView).not.toHaveBeenCalled();
  });

  it('does not render in focus mode', () => {
    usePrefsStore.setState({ focusMode: true });

    render(
      <MemoryRouter initialEntries={['/']}>
        <MiniTimer />
      </MemoryRouter>,
    );

    act(() => {
      intersectCallback([{ isIntersecting: false }]);
    });
    expect(screen.queryByRole('region', { name: /sticky timer/i })).not.toBeInTheDocument();
  });
});
