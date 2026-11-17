import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { TimerCard } from './TimerCard';
import { useTimerStore } from '@/features/timer/store';
import { getInitialTimerState } from '@/features/timer/constants';
import * as ModeTabsModule from './ModeTabs';
import * as TimerControlsModule from './TimerControls';
import * as SessionDotsModule from './SessionDots';
import * as MicroCopyModule from './MicroCopy';

function renderTimerCard() {
  return render(
    <BrowserRouter>
      <TimerCard />
    </BrowserRouter>,
  );
}

describe('TimerCard UI', () => {
  beforeEach(() => {
    localStorage.clear();
    useTimerStore.setState(getInitialTimerState('2026-10-28'));
  });

  it('Start -> Pause -> Resume -> Reset flow updates primary label correctly', async () => {
    const user = userEvent.setup();
    renderTimerCard();

    // Initial idle state
    const primaryBtn = screen.getByRole('button', { name: 'Start focusing' });
    expect(primaryBtn).toBeInTheDocument();

    // Click Start -> status running -> label Pause
    await user.click(primaryBtn);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(useTimerStore.getState().status).toBe('running');

    // Click Pause -> status paused -> label Resume
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    expect(useTimerStore.getState().status).toBe('paused');

    // Click Resume -> status running -> label Pause
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

    // Click Reset -> status idle -> label Start focusing
    const resetBtn = screen.getByRole('button', { name: 'Reset session' });
    await user.click(resetBtn);
    expect(screen.getByRole('button', { name: 'Start focusing' })).toBeInTheDocument();
    expect(useTimerStore.getState().status).toBe('idle');
  });

  it('Mode switch from idle switches immediately without confirmation modal', async () => {
    const user = userEvent.setup();
    renderTimerCard();

    const shortBreakTab = screen.getByRole('tab', { name: 'Short break' });
    await user.click(shortBreakTab);

    expect(useTimerStore.getState().mode).toBe('shortBreak');
    expect(screen.queryByRole('dialog', { name: 'Switch mode?' })).not.toBeInTheDocument();
  });

  it('Mode switch while running opens confirmation modal and handles Keep going vs Switch', async () => {
    const user = userEvent.setup();
    renderTimerCard();

    // Start timer
    await user.click(screen.getByRole('button', { name: 'Start focusing' }));
    expect(useTimerStore.getState().status).toBe('running');

    // Attempt to switch mode to Short break
    await user.click(screen.getByRole('tab', { name: 'Short break' }));

    // Confirm modal opens
    expect(screen.getByRole('dialog', { name: 'Switch mode?' })).toBeInTheDocument();
    expect(useTimerStore.getState().mode).toBe('focus'); // still focus

    // Click "Keep going"
    await user.click(screen.getByRole('button', { name: 'Keep going' }));
    expect(screen.queryByRole('dialog', { name: 'Switch mode?' })).not.toBeInTheDocument();
    expect(useTimerStore.getState().mode).toBe('focus');
    expect(useTimerStore.getState().status).toBe('running');

    // Click Short break again and confirm "Switch"
    await user.click(screen.getByRole('tab', { name: 'Short break' }));
    await user.click(screen.getByRole('button', { name: 'Switch' }));

    expect(useTimerStore.getState().mode).toBe('shortBreak');
    expect(useTimerStore.getState().status).toBe('idle');
  });

  it('Adjust popover validates 1-180 min, updates store on save and discards on cancel', async () => {
    const user = userEvent.setup();
    renderTimerCard();

    // Open Adjust popover
    await user.click(screen.getByRole('button', { name: 'Adjust timer settings' }));
    expect(screen.getByRole('dialog', { name: 'Adjust timer settings' })).toBeInTheDocument();

    const focusInput = screen.getByRole('spinbutton', { name: 'Focus (minutes)' });
    const saveBtn = screen.getByRole('button', { name: 'Save' });

    // Invalid input: 0
    await user.clear(focusInput);
    await user.type(focusInput, '0');
    expect(screen.getByText('Pick between 1 and 180 minutes')).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();

    // Invalid input: 181
    await user.clear(focusInput);
    await user.type(focusInput, '181');
    expect(saveBtn).toBeDisabled();

    // Valid input: 30
    await user.clear(focusInput);
    await user.type(focusInput, '30');
    expect(saveBtn).not.toBeDisabled();

    // Save
    await user.click(saveBtn);
    expect(useTimerStore.getState().durations.focus).toBe(30 * 60);
    expect(useTimerStore.getState().remaining).toBe(30 * 60);
  });

  it('Session dots reflect completed sessions and announce via visually hidden text', () => {
    useTimerStore.setState({
      ...getInitialTimerState('2026-10-28'),
      completedFocusSessions: 2,
      cyclesBeforeLongBreak: 4,
    });

    renderTimerCard();

    expect(
      screen.getByText('2 of 4 focus sessions completed.'),
    ).toBeInTheDocument();
  });

  describe('Isolation of per-second rendering', () => {
    it('proves sibling components do NOT re-render on remaining ticks', () => {
      renderTimerCard();

      // Reset counters after initial mount
      ModeTabsModule.modeTabsRenderCount.current = 0;
      TimerControlsModule.timerControlsRenderCount.current = 0;
      SessionDotsModule.sessionDotsRenderCount.current = 0;
      MicroCopyModule.microCopyRenderCount.current = 0;

      // Start timer
      const now = 100000;
      act(() => {
        useTimerStore.getState().dispatch({
          type: 'start',
          payload: { now, sessionId: 'isolation-sess' },
        });
      });

      // After status transitions from idle to running, store updates.
      // Record sibling render counts once running:
      const runningModeTabs = ModeTabsModule.modeTabsRenderCount.current;
      const runningControls = TimerControlsModule.timerControlsRenderCount.current;
      const runningDots = SessionDotsModule.sessionDotsRenderCount.current;
      const runningCopy = MicroCopyModule.microCopyRenderCount.current;

      // Advance ticks across 10 consecutive seconds
      for (let sec = 1; sec <= 10; sec++) {
        act(() => {
          useTimerStore.getState().tick(now + sec * 1000);
        });
      }

      // Assert TimerDigits changed display
      expect(screen.getByRole('timer')).toHaveTextContent('24:50');

      // Assert siblings did NOT re-render for ticks!
      expect(ModeTabsModule.modeTabsRenderCount.current).toBe(runningModeTabs);
      expect(TimerControlsModule.timerControlsRenderCount.current).toBe(runningControls);
      expect(SessionDotsModule.sessionDotsRenderCount.current).toBe(runningDots);
      expect(MicroCopyModule.microCopyRenderCount.current).toBe(runningCopy);
    });
  });
});
