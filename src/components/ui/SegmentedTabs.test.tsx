import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';

const options = [
  { value: 'focus', label: 'Focus' },
  { value: 'short', label: 'Short break' },
  { value: 'long', label: 'Long break' },
] as const;

type SessionType = (typeof options)[number]['value'];

function setup(value: SessionType = 'focus', onChange = vi.fn()) {
  return {
    user: userEvent.setup(),
    onChange,
    ...render(
      <SegmentedTabs<SessionType>
        value={value}
        onChange={onChange}
        options={options}
      />,
    ),
  };
}

describe('SegmentedTabs', () => {
  it('renders all options', () => {
    setup();
    expect(screen.getByRole('tab', { name: 'Focus' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Short break' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Long break' })).toBeInTheDocument();
  });

  it('marks the selected tab as aria-selected', () => {
    setup('short');
    expect(screen.getByRole('tab', { name: 'Short break' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Focus' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange when a tab is clicked', async () => {
    const { user, onChange } = setup();
    await user.click(screen.getByRole('tab', { name: 'Long break' }));
    expect(onChange).toHaveBeenCalledWith('long');
  });

  it('navigates right with ArrowRight key', async () => {
    const { user, onChange } = setup('focus');
    const tablist = screen.getByRole('tablist');
    screen.getByRole('tab', { name: 'Focus' }).focus();
    await user.type(tablist, '{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('short');
  });

  it('navigates left with ArrowLeft key', async () => {
    const { user, onChange } = setup('short');
    screen.getByRole('tab', { name: 'Short break' }).focus();
    await user.type(screen.getByRole('tablist'), '{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith('focus');
  });

  it('jumps to first tab with Home key', async () => {
    const { user, onChange } = setup('long');
    screen.getByRole('tab', { name: 'Long break' }).focus();
    await user.type(screen.getByRole('tablist'), '{Home}');
    expect(onChange).toHaveBeenCalledWith('focus');
  });

  it('jumps to last tab with End key', async () => {
    const { user, onChange } = setup('focus');
    screen.getByRole('tab', { name: 'Focus' }).focus();
    await user.type(screen.getByRole('tablist'), '{End}');
    expect(onChange).toHaveBeenCalledWith('long');
  });

  it('has correct tablist role', () => {
    setup();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
