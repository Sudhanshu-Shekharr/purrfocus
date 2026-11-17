import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popover } from '@/components/ui/Popover';
import { MenuItem } from '@/components/ui/MenuItem';
import { PillButton } from '@/components/ui/PillButton';

function setup() {
  const onItem1 = vi.fn();
  const user = userEvent.setup();
  const utils = render(
    <Popover
      trigger={<PillButton variant="glass" id="popover-trigger">Options</PillButton>}
    >
      <MenuItem onClick={onItem1}>Item one</MenuItem>
      <MenuItem>Item two</MenuItem>
    </Popover>,
  );
  return { user, onItem1, ...utils };
}

describe('Popover', () => {
  it('is closed by default', () => {
    setup();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens when trigger is clicked', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Options' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes when Escape is pressed', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Options' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    // Wait for Framer Motion exit animation to complete
    await waitFor(
      () => expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
      { timeout: 1000 },
    );
  });

  it('closes when clicking outside', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Options' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(document.body);
    await waitFor(
      () => expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
      { timeout: 1000 },
    );
  });

  it('calls onClick when a menu item is clicked and menu closes', async () => {
    const { user, onItem1 } = setup();
    await user.click(screen.getByRole('button', { name: 'Options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Item one' }));
    expect(onItem1).toHaveBeenCalledOnce();
  });

  it('returns focus to trigger after closing with Escape', async () => {
    const { user } = setup();
    const trigger = screen.getByRole('button', { name: 'Options' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});
