import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AppShell } from '@/app/AppShell';
import { HomePage } from './Home';
import { DeskPage } from './Desk';
import { JournalPage } from './Journal';
import { RoomsPage } from './Rooms';
import { NotFoundPage } from './NotFound';
import { useTimerStore } from '@/features/timer/store';
import { usePrefsStore } from '@/features/prefs/store';

import { Providers } from '@/app/providers';

function renderWithRouter(initialEntry = '/') {
  return render(
    <Providers>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            element={
              <AppShell>
                <Outlet />
              </AppShell>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="/desk" element={<DeskPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Providers>,
  );
}

describe('Route Navigation & Behavior', () => {
  beforeEach(() => {
    useTimerStore.getState().reset();
    usePrefsStore.getState().resetPrefs();
  });

  it('renders HomePage with header navigation', () => {
    renderWithRouter('/');
    expect(screen.getByRole('link', { name: 'My desk' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My journal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Study with friends' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Focus mode' })).toBeInTheDocument();
  });

  it('renders DeskPage with single h1 and back link', () => {
    renderWithRouter('/desk');
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('My Desk');
    expect(screen.getByRole('link', { name: '← Back to my desk' })).toHaveAttribute('href', '/');
    // Focus mode button should be hidden on non-home routes
    expect(screen.queryByRole('button', { name: 'Focus mode' })).not.toBeInTheDocument();
  });

  it('renders JournalPage with single h1 and back link', () => {
    renderWithRouter('/journal');
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('My Journal');
    expect(screen.getByRole('link', { name: '← Back to my desk' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('button', { name: 'Focus mode' })).not.toBeInTheDocument();
  });

  it('renders RoomsPage with single h1 and back link', () => {
    renderWithRouter('/rooms');
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Study with Friends');
    expect(screen.getByRole('link', { name: '← Back to my desk' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('button', { name: 'Focus mode' })).not.toBeInTheDocument();
  });

  it('renders gentle NotFoundPage for unknown routes with home link', () => {
    renderWithRouter('/non-existent-secret-garden');
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Page Not Found');
    expect(screen.getByRole('link', { name: '← Back to my desk' })).toHaveAttribute('href', '/');
  });

  it('does not trigger timer shortcuts when on non-home routes (/desk)', () => {
    renderWithRouter('/desk');

    const initialState = useTimerStore.getState();
    expect(initialState.status).toBe('idle');

    // Press Space
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    });
    expect(useTimerStore.getState().status).toBe('idle');

    // Press 'r'
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    });
    expect(useTimerStore.getState().status).toBe('idle');

    // Press '2' (short break)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }));
    });
    expect(useTimerStore.getState().mode).toBe('focus');
  });

  it('does not trigger focus mode shortcut "f" when on /desk', () => {
    renderWithRouter('/desk');
    expect(usePrefsStore.getState().focusMode).toBe(false);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
    });
    expect(usePrefsStore.getState().focusMode).toBe(false);
  });
});
