import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TimerCard } from './TimerCard';
import { timerDigitsRenderCount } from './TimerDigits';
import { modeTabsRenderCount } from './ModeTabs';
import { useTimerStore } from '@/features/timer/store';

describe('Timer Render Isolation (§6.3, §8)', () => {
  beforeEach(() => {
    useTimerStore.setState({
      status: 'running',
      mode: 'focus',
      remaining: 1500,
      durations: { focus: 1500, shortBreak: 300, longBreak: 900 },
    });
    timerDigitsRenderCount.current = 0;
    modeTabsRenderCount.current = 0;
  });

  it('isolates countdown renders: TimerDigits re-renders on second ticks while sibling components do not', () => {
    render(
      <MemoryRouter>
        <TimerCard />
      </MemoryRouter>,
    );

    expect(screen.getByRole('timer')).toHaveTextContent('25:00');
    expect(timerDigitsRenderCount.current).toBe(1);
    expect(modeTabsRenderCount.current).toBe(1);

    // Tick 5 seconds: remaining 1499 -> 1495
    for (let i = 1; i <= 5; i++) {
      act(() => {
        useTimerStore.setState({ remaining: 1500 - i });
      });
    }

    // Timer digits should reflect 24:55
    expect(screen.getByRole('timer')).toHaveTextContent('24:55');

    // TimerDigits re-rendered for each tick: 1 initial + 5 ticks = 6 renders
    expect(timerDigitsRenderCount.current).toBe(6);

    // ModeTabs MUST NOT re-render on second ticks
    expect(modeTabsRenderCount.current).toBe(1);
  });
});
