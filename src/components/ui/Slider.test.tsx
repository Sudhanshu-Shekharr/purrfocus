import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from '@/components/ui/Slider';

function setup(value = 50, onChange = vi.fn()) {
  return {
    user: userEvent.setup(),
    onChange,
    ...render(
      <Slider
        aria-label="Test volume"
        value={value}
        onChange={onChange}
        min={0}
        max={100}
        step={1}
        showValue
      />,
    ),
  };
}

describe('Slider', () => {
  it('renders with correct ARIA attributes', () => {
    setup(40);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '40');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-label', 'Test volume');
  });

  it('increments value on ArrowRight', async () => {
    const { user, onChange } = setup(50);
    screen.getByRole('slider').focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith(51);
  });

  it('decrements value on ArrowLeft', async () => {
    const { user, onChange } = setup(50);
    screen.getByRole('slider').focus();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith(49);
  });

  it('jumps to min on Home', async () => {
    const { user, onChange } = setup(50);
    screen.getByRole('slider').focus();
    await user.keyboard('{Home}');
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('jumps to max on End', async () => {
    const { user, onChange } = setup(50);
    screen.getByRole('slider').focus();
    await user.keyboard('{End}');
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it('clamps at min boundary', async () => {
    const { user, onChange } = setup(0);
    screen.getByRole('slider').focus();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('clamps at max boundary', async () => {
    const { user, onChange } = setup(100);
    screen.getByRole('slider').focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it('does not fire onChange when disabled', async () => {
    const onChange = vi.fn();
    const { user } = {
      user: userEvent.setup(),
      ...render(
        <Slider
          aria-label="Disabled"
          value={50}
          onChange={onChange}
          min={0}
          max={100}
          disabled
        />,
      ),
    };
    screen.getByRole('slider').focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).not.toHaveBeenCalled();
  });
});
