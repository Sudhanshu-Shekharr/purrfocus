import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FooterStrip } from './FooterStrip';
import { useStatsStore } from '@/features/stats/store';
import { getTodayDateString } from '@/features/timer/constants';

function renderFooter() {
  return render(
    <BrowserRouter>
      <FooterStrip />
    </BrowserRouter>,
  );
}

describe('FooterStrip', () => {
  beforeEach(() => {
    localStorage.clear();
    useStatsStore.getState().clearLogs();
  });

  it('displays 0 min of focus today by default', () => {
    renderFooter();
    expect(screen.getByText('0 min of focus today')).toBeInTheDocument();
  });

  it('updates live when a focus session is logged', () => {
    renderFooter();

    expect(screen.getByText('0 min of focus today')).toBeInTheDocument();

    const today = getTodayDateString();
    act(() => {
      useStatsStore.getState().logFocusSession({
        id: 'session-1',
        minutes: 25,
        date: today,
      });
    });

    expect(screen.getByText('25 min of focus today')).toBeInTheDocument();

    // Log another 25 min session
    act(() => {
      useStatsStore.getState().logFocusSession({
        id: 'session-2',
        minutes: 25,
        date: today,
      });
    });

    expect(screen.getByText('50 min of focus today')).toBeInTheDocument();
  });

  it('does not double count duplicate session IDs', () => {
    renderFooter();

    const today = getTodayDateString();
    act(() => {
      useStatsStore.getState().logFocusSession({
        id: 'session-dup',
        minutes: 30,
        date: today,
      });
    });

    expect(screen.getByText('30 min of focus today')).toBeInTheDocument();

    // Idempotent duplicate call
    act(() => {
      useStatsStore.getState().logFocusSession({
        id: 'session-dup',
        minutes: 30,
        date: today,
      });
    });

    expect(screen.getByText('30 min of focus today')).toBeInTheDocument();
  });

  it('ignores sessions logged for previous dates', () => {
    renderFooter();

    act(() => {
      useStatsStore.getState().logFocusSession({
        id: 'session-yesterday',
        minutes: 45,
        date: '2026-10-01',
      });
    });

    // Still 0 min today
    expect(screen.getByText('0 min of focus today')).toBeInTheDocument();
  });

  it('renders journal link and cozy tagline', () => {
    renderFooter();
    expect(screen.getByText('Made for slow mornings & small victories.')).toBeInTheDocument();
    const journalLink = screen.getByRole('link', { name: 'My journal ↗' });
    expect(journalLink).toHaveAttribute('href', '/journal');
  });
});
