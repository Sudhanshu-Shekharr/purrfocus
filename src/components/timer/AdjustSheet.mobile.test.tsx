import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdjustPopover } from './AdjustPopover';

describe('AdjustPopover on mobile', () => {
  beforeEach(() => {
    // Mock matchMedia to simulate mobile screen (< 768px)
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width: 767px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('renders bottom sheet modal on mobile when Adjust trigger is clicked', async () => {
    render(<AdjustPopover />);

    const trigger = screen.getByRole('button', { name: /adjust timer settings/i });
    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);

    // Modal dialog should open
    const dialog = screen.getByRole('dialog', { name: /timer settings/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveClass('bottom-0');
    expect(dialog).toHaveClass('rounded-t-card');

    // Inputs inside sheet
    expect(screen.getByLabelText(/focus \(minutes\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/short break \(minutes\)/i)).toBeInTheDocument();

    // Close with Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
