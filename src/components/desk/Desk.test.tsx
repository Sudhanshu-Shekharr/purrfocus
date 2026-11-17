import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DeskPage } from '@/pages/Desk';
import { useStatsStore } from '@/features/stats/store';
import { useCatStore } from '@/features/cat/store';
import { useCatRuntimeStore } from '@/features/cat/controller';
import { getTodayDateString } from '@/features/timer/constants';

function renderDesk(onOpenSettings = () => {}) {
  return render(
    <MemoryRouter initialEntries={['/desk']}>
      <DeskPage onOpenSettings={onOpenSettings} />
    </MemoryRouter>,
  );
}

describe('DeskPage & Desk Components', () => {
  beforeEach(() => {
    useStatsStore.getState().clearLogs();
    useCatStore.getState().resetCat();
  });

  it('renders gentle empty state for a new user with 0 minutes', () => {
    renderDesk();

    expect(screen.getByText('Your desk fills up as you focus. No rush.')).toBeInTheDocument();
    expect(screen.getByText('My Desk')).toBeInTheDocument();

    // Verify 0 stats render cleanly without errors
    const statRow = screen.getByTestId('desk-stats-row');
    expect(statRow).toBeInTheDocument();
    expect(screen.getByLabelText('Today focus stats')).toHaveTextContent('0 min');
    expect(screen.getByLabelText('This week focus stats')).toHaveTextContent('0 min');
    expect(screen.getByLabelText('All time focus stats')).toHaveTextContent('0 min');
    expect(screen.getByLabelText('Current streak and companion bond')).toHaveTextContent('0 days');
  });

  it('displays accurate numbers across stat cards from fixture data', () => {
    const today = getTodayDateString();
    const [y, m, d] = today.split('-').map(Number);
    const yesterday = new Date(y!, m! - 1, d! - 1);
    const fmt = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const yesterdayStr = fmt(yesterday);

    useStatsStore.setState({
      logs: [
        {
          sessionId: 's1',
          date: today,
          completedAt: Date.now(),
          minutes: 30,
          subject: 'Math',
          source: 'finish',
        },
        {
          sessionId: 's2',
          date: today,
          completedAt: Date.now() + 1000,
          minutes: 45,
          subject: 'English',
          source: 'finish',
        },
        {
          sessionId: 's3',
          date: yesterdayStr,
          completedAt: Date.now() - 86400000,
          minutes: 50,
          subject: 'Math',
          source: 'finish',
        },
      ],
    });

    useCatStore.setState({ bond: 65 }); // Best friend (threshold: 60)

    renderDesk();

    // Today: 30 + 45 = 75 min, 2 sessions
    const todayCard = screen.getByLabelText('Today focus stats');
    expect(todayCard).toHaveTextContent('75 min');
    expect(todayCard).toHaveTextContent('2 sessions');

    // This week: 30 + 45 + 50 = 125 min, 3 sessions
    const weekCard = screen.getByLabelText('This week focus stats');
    expect(weekCard).toHaveTextContent('125 min');
    expect(weekCard).toHaveTextContent('3 sessions');

    // All time: 125 min, 3 sessions
    const allTimeCard = screen.getByLabelText('All time focus stats');
    expect(allTimeCard).toHaveTextContent('125 min');
    expect(allTimeCard).toHaveTextContent('3 sessions');

    // Streak & Bond: 2 days streak, "Best friend" bond level
    const streakCard = screen.getByLabelText('Current streak and companion bond');
    expect(streakCard).toHaveTextContent('2 days');
    expect(streakCard).toHaveTextContent('Best friend');
  });

  it('maintains parity between WeeklyBarChart visual chart and hidden accessible table', () => {
    const today = getTodayDateString();

    useStatsStore.setState({
      logs: [
        {
          sessionId: 'sess-today',
          date: today,
          completedAt: Date.now(),
          minutes: 60,
          subject: 'Physics',
          source: 'finish',
        },
      ],
    });

    renderDesk();

    // Find the accessible table inside WeeklyBarChart
    const table = screen.getByRole('table', { name: 'Weekly focus breakdown' });
    expect(table).toBeInTheDocument();
    expect(table).toHaveTextContent(today);
    expect(table).toHaveTextContent('60');
  });

  it('renders SubjectDonut table with grouped subjects and calculates percentages', () => {
    const today = getTodayDateString();

    useStatsStore.setState({
      logs: [
        { sessionId: '1', date: today, completedAt: Date.now(), minutes: 50, subject: 'Algebra', source: 'finish' },
        { sessionId: '2', date: today, completedAt: Date.now(), minutes: 50, subject: 'Biology', source: 'finish' },
      ],
    });

    renderDesk();

    const subjectTable = screen.getByRole('table', { name: 'Detailed breakdown of focus time by subject' });
    expect(subjectTable).toHaveTextContent('Algebra');
    expect(subjectTable).toHaveTextContent('50 min');
    expect(subjectTable).toHaveTextContent('50%');

    expect(subjectTable).toHaveTextContent('Biology');
    expect(subjectTable).toHaveTextContent('50 min');
    expect(subjectTable).toHaveTextContent('50%');
  });

  it('supports roving focus keyboard navigation in HeatmapCalendar', () => {
    renderDesk();

    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();

    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBe(182); // 26 * 7

    // Last cell (default focus target)
    const initialFocused = cells.find(c => c.getAttribute('tabIndex') === '0');
    expect(initialFocused).toBeDefined();

    // Focus the cell and press ArrowLeft to navigate
    initialFocused?.focus();
    act(() => {
      initialFocused?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });

    // Check that roving tabindex moved
    const newFocused = cells.find(c => c.getAttribute('tabIndex') === '0');
    expect(newFocused).toBeDefined();
    expect(newFocused).not.toBe(initialFocused);
  });

  it('renders locked and unlocked collectibles and reacts to taps with cat dialogue', () => {
    // 60 minutes unlocks tea-mug (threshold: 60)
    useStatsStore.setState({
      logs: [
        {
          sessionId: 'sess-unlock',
          date: getTodayDateString(),
          completedAt: Date.now(),
          minutes: 60,
          subject: null,
          source: 'finish',
        },
      ],
    });

    renderDesk();

    // Tea mug is unlocked
    const mugBtn = screen.getByRole('button', { name: /Cozy Ceramic Mug \(Unlocked\)/i });
    expect(mugBtn).toBeInTheDocument();

    // Plant is locked
    const plantLocked = screen.getByRole('img', { name: /Potted Pothos \(Locked\)/i });
    expect(plantLocked).toBeInTheDocument();

    // Tap unlocked tea mug
    act(() => {
      mugBtn.click();
    });

    // Cat dialogue updates
    const line = useCatRuntimeStore.getState().currentLine;
    expect(line).toBeTruthy();

    // Tap again within cooldown returns false
    const immediateSuccess = useCatRuntimeStore.getState().deskTap(Date.now());
    expect(immediateSuccess).toBe(false);
  });
});
