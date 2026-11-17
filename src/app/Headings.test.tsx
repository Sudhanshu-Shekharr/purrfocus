import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import { HomePage } from '@/pages/Home';
import { DeskPage } from '@/pages/Desk';
import { JournalPage } from '@/pages/Journal';

describe('Headings & Landmarks (§7.4)', () => {
  it('renders strictly one h1 on Home page', () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/']}>
          <HomePage />
        </MemoryRouter>
      </ToastProvider>,
    );

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(/Study with a cat/i);
  });

  it('renders strictly one h1 on Desk page', () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/desk']}>
          <DeskPage />
        </MemoryRouter>
      </ToastProvider>,
    );

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(/My Desk/i);
  });

  it('renders strictly one h1 on Journal page', () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/journal']}>
          <JournalPage />
        </MemoryRouter>
      </ToastProvider>,
    );

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(/My Journal/i);
  });
});
