import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/components/ui/Modal';
import { PillButton } from '@/components/ui/PillButton';

function setup(open = true, onClose = vi.fn()) {
  return {
    user: userEvent.setup(),
    onClose,
    ...render(
      <Modal open={open} onClose={onClose} title="Test modal" variant="center">
        <p>Modal content</p>
        <PillButton variant="primary" onClick={onClose}>
          Close action
        </PillButton>
      </Modal>,
    ),
  };
}

describe('Modal', () => {
  it('renders nothing when closed', () => {
    setup(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog with aria-modal when open', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has an accessible title linked by aria-labelledby', () => {
    setup();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
    expect(screen.getByText('Test modal')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', async () => {
    const { user, onClose } = setup();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the close button is clicked', async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('contains focus within the modal (focus trap)', async () => {
    const { user } = setup();
    // Tab through all focusable elements
    await user.tab();
    await user.tab();
    await user.tab();
    // Focus should remain inside the dialog
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('renders pinned footer when provided', () => {
    render(
      <Modal
        open={true}
        onClose={vi.fn()}
        title="Footer test"
        variant="center"
        footer={<button type="button">Pinned Action</button>}
      >
        <p>Modal body</p>
      </Modal>,
    );

    expect(screen.getByRole('button', { name: 'Pinned Action' })).toBeInTheDocument();
  });
});
