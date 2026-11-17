import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RoomsPage } from './Rooms';

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('RoomsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders page heading and coming-soon card', () => {
    renderWithRouter(<RoomsPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /Study with Friends/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Rooms are coming soon/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Back to my desk/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to my desk/i })).toBeInTheDocument();
  });

  it('displays privacy guarantees clearly', () => {
    renderWithRouter(<RoomsPage />);
    expect(screen.getByText(/Cozy Privacy Guarantee/i)).toBeInTheDocument();
    expect(screen.getByText(/Completely Anonymous/i)).toBeInTheDocument();
    expect(screen.getByText(/Presence Only/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your tasks, private session notes, personal stats, and local files will never be transmitted/i),
    ).toBeInTheDocument();
  });

  it('makes zero network calls', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderWithRouter(<RoomsPage />);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
