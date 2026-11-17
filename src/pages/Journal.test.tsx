import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { JournalPage } from './Journal';
import { useStatsStore } from '@/features/stats/store';
import * as exportJournal from '@/lib/exportJournal';
import type { SessionLog } from '@/features/stats/types';

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('JournalPage', () => {
  beforeEach(() => {
    useStatsStore.setState({ logs: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders page heading and empty state when there are no logs', () => {
    renderWithRouter(<JournalPage />);
    expect(screen.getByRole('heading', { level: 1, name: /My Journal/i })).toBeInTheDocument();
    expect(screen.getByText(/Back to my desk/i)).toBeInTheDocument();
    expect(screen.getByText(/No journal entries yet/i)).toBeInTheDocument();
  });

  it('renders session entries and date groups when logs are present', () => {
    const logs: SessionLog[] = [
      {
        sessionId: 'sess-today',
        date: '2026-11-16',
        completedAt: 1763286400000,
        minutes: 25,
        subject: 'Math',
        mood: 4,
        note: 'Felt focused and calm',
        source: 'finish',
      },
      {
        sessionId: 'sess-yesterday',
        date: '2026-11-15',
        completedAt: 1763200000000,
        minutes: 45,
        subject: null,
        source: 'finish',
      },
    ];

    useStatsStore.setState({ logs });

    renderWithRouter(<JournalPage />);
    expect(screen.getAllByText(/Math/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Untagged/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Felt focused and calm/i)).toBeInTheDocument();
    expect(screen.getByText(/25 min/i)).toBeInTheDocument();
    expect(screen.getByText(/45 min/i)).toBeInTheDocument();
  });

  it('filters sessions by subject dropdown', () => {
    const logs: SessionLog[] = [
      {
        sessionId: 'sess-math',
        date: '2026-11-16',
        completedAt: 1763286400000,
        minutes: 25,
        subject: 'Math',
        source: 'finish',
      },
      {
        sessionId: 'sess-physics',
        date: '2026-11-16',
        completedAt: 1763286000000,
        minutes: 30,
        subject: 'Physics',
        source: 'finish',
      },
    ];

    useStatsStore.setState({ logs });

    renderWithRouter(<JournalPage />);
    expect(screen.getByRole('article', { name: /25 minutes/i })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: /30 minutes/i })).toBeInTheDocument();

    const select = screen.getByLabelText(/filter by subject/i);
    fireEvent.change(select, { target: { value: 'Math' } });

    expect(screen.getByRole('article', { name: /25 minutes/i })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: /30 minutes/i })).not.toBeInTheDocument();
  });

  it('triggers export functions when buttons are clicked', () => {
    const mdSpy = vi.spyOn(exportJournal, 'downloadJournalMarkdown').mockImplementation(() => {});
    const csvSpy = vi.spyOn(exportJournal, 'downloadJournalCsv').mockImplementation(() => {});

    const logs: SessionLog[] = [
      {
        sessionId: 'sess-1',
        date: '2026-11-16',
        completedAt: 1763286400000,
        minutes: 25,
        subject: 'Math',
        source: 'finish',
      },
    ];

    useStatsStore.setState({ logs });

    renderWithRouter(<JournalPage />);

    const mdBtn = screen.getByRole('button', { name: /export journal as markdown/i });
    fireEvent.click(mdBtn);
    expect(mdSpy).toHaveBeenCalledTimes(1);

    const csvBtn = screen.getByRole('button', { name: /export journal as csv/i });
    fireEvent.click(csvBtn);
    expect(csvSpy).toHaveBeenCalledTimes(1);
  });

  it('handles pagination with "Show more" button when entries exceed 50', () => {
    const logs: SessionLog[] = [];
    for (let i = 0; i < 75; i++) {
      logs.push({
        sessionId: `sess-${i}`,
        date: '2026-11-16',
        completedAt: 1763286400000 - i * 1000,
        minutes: 25,
        subject: 'Study',
        source: 'finish',
      });
    }

    useStatsStore.setState({ logs });

    renderWithRouter(<JournalPage />);

    expect(screen.getByText(/Showing 50 of 75 sessions/i)).toBeInTheDocument();
    const showMoreBtn = screen.getByRole('button', { name: /show more sessions/i });
    fireEvent.click(showMoreBtn);

    // After clicking, all 75 should be visible, and button disappears
    expect(screen.queryByRole('button', { name: /show more sessions/i })).not.toBeInTheDocument();
  });
});
