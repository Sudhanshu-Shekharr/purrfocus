import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PillButton } from '@/components/ui/PillButton';

describe('PillButton', () => {
  it('renders with correct text and press feedback class', () => {
    render(<PillButton variant="primary">Click me</PillButton>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn-press');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<PillButton variant="primary" onClick={onClick}>Click me</PillButton>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does NOT call onClick when disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<PillButton variant="primary" onClick={onClick} disabled>Click me</PillButton>);
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does NOT call onClick when loading', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<PillButton variant="primary" onClick={onClick} loading>Click me</PillButton>);
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('has aria-busy when loading', () => {
    render(<PillButton variant="primary" loading>Click me</PillButton>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('is disabled when loading', () => {
    render(<PillButton variant="primary" loading>Click me</PillButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies aria-label when provided', () => {
    render(<PillButton variant="primary" aria-label="Start session">▶</PillButton>);
    expect(screen.getByRole('button', { name: 'Start session' })).toBeInTheDocument();
  });
});
