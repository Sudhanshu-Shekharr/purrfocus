import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import { AppShell } from './AppShell';

describe('Skip Link (§7.1)', () => {
  it('renders "Skip to timer" linking to #timer-card on Home page', () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/']}>
          <AppShell>
            <div>Home content</div>
          </AppShell>
        </MemoryRouter>
      </ToastProvider>,
    );

    const skipLink = screen.getByRole('link', { name: /skip to timer/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#timer-card');
  });

  it('renders "Skip to content" linking to #main-content on secondary routes', () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/desk']}>
          <AppShell>
            <div>Desk content</div>
          </AppShell>
        </MemoryRouter>
      </ToastProvider>,
    );

    const skipLink = screen.getByRole('link', { name: /skip to content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });
});
