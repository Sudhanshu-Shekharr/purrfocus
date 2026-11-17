import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModeTabs } from './ModeTabs';
import { TimerDigits } from './TimerDigits';
import { useTimerStore } from '@/features/timer/store';

describe('Timer Mode Tabs & Tabpanel (§7.3)', () => {
  it('renders tablist with role="tab" and aria-selected', () => {
    useTimerStore.setState({ mode: 'focus', status: 'idle' });

    render(
      <div>
        <ModeTabs />
        <TimerDigits />
      </div>,
    );

    const tablist = screen.getByRole('tablist', { name: /session type/i });
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);

    // Focus tab is selected
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');

    // Countdown display has role="tabpanel"
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toBeInTheDocument();
    expect(tabpanel).toHaveAttribute('id', 'timer-tabpanel');
  });

  it('supports roving focus with ArrowLeft and ArrowRight keys', () => {
    useTimerStore.setState({ mode: 'focus', status: 'idle' });

    render(
      <div>
        <ModeTabs />
        <TimerDigits />
      </div>,
    );

    const tablist = screen.getByRole('tablist', { name: /session type/i });

    // ArrowRight moves from Focus -> Short break
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(useTimerStore.getState().mode).toBe('shortBreak');

    // ArrowRight again moves to Long break
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(useTimerStore.getState().mode).toBe('longBreak');

    // ArrowLeft moves back to Short break
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    expect(useTimerStore.getState().mode).toBe('shortBreak');

    // Home key moves to first tab (Focus)
    fireEvent.keyDown(tablist, { key: 'Home' });
    expect(useTimerStore.getState().mode).toBe('focus');

    // End key moves to last tab (Long break)
    fireEvent.keyDown(tablist, { key: 'End' });
    expect(useTimerStore.getState().mode).toBe('longBreak');
  });
});
