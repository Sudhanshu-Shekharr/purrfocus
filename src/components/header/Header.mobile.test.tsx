import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';
import { useUiStore } from '@/features/ui/store';

describe('Header mobile chrome', () => {
  it('renders logo and hamburger button', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /purrfocus home/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /open navigation menu/i }),
    ).toBeInTheDocument();
  });

  it('opens bottom menu sheet on hamburger button click with 44px items', () => {
    useUiStore.setState({ mobileMenuOpen: false });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
    fireEvent.click(menuButton);

    const dialog = screen.getByRole('dialog', { name: /navigation & controls/i });
    expect(dialog).toBeInTheDocument();

    // Verify secondary links exist in sheet
    expect(within(dialog).getByRole('link', { name: /my desk/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /my journal/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /study with friends/i })).toBeInTheDocument();

    // Verify sound effects and focus mode controls exist in sheet
    expect(within(dialog).getByRole('button', { name: /sound effects/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /enter focus mode/i })).toBeInTheDocument();

    // Check min-height class on sheet links
    const deskLink = within(dialog).getByRole('link', { name: /my desk/i });
    expect(deskLink).toHaveClass('min-h-[44px]');
  });

  it('closes sheet when close button is clicked', () => {
    useUiStore.setState({ mobileMenuOpen: true });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(useUiStore.getState().mobileMenuOpen).toBe(false);
  });
});
