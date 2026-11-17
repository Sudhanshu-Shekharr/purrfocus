import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OutfitSheet } from './OutfitSheet';
import { useCatStore } from '@/features/cat/store';

describe('OutfitSheet Component', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    useCatStore.getState().resetCat();
  });

  it('renders modal dialog when open', () => {
    render(<OutfitSheet open={true} onClose={onClose} />);

    expect(screen.getByText('Customize Companion')).toBeInTheDocument();
    expect(screen.getAllByText('Mochi').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Chai')).toBeInTheDocument();
    expect(screen.getByText('Natural Fur')).toBeInTheDocument();
  });

  it('displays current bond level info and points to next level', () => {
    useCatStore.setState({ bond: 10 });
    render(<OutfitSheet open={true} onClose={onClose} />);

    expect(screen.getByText('Stranger')).toBeInTheDocument();
    expect(screen.getByText('(10 bond)')).toBeInTheDocument();
    expect(screen.getByText('10 pts to Friend')).toBeInTheDocument();
  });

  it('enables all outfits and characters immediately with a fresh store', () => {
    useCatStore.setState({ bond: 0 });
    render(<OutfitSheet open={true} onClose={onClose} />);

    // All characters enabled
    expect(screen.getByRole('button', { name: /Mochi/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Chai/i })).toBeEnabled();

    // All outfits enabled immediately, even with 0 bond
    const naturalFur = screen.getByRole('button', { name: /Natural Fur/i });
    expect(naturalFur).toBeEnabled();

    const wireGlasses = screen.getByRole('button', { name: /Wire Glasses/i });
    expect(wireGlasses).toBeEnabled();

    const scarf = screen.getByRole('button', { name: /Cozy Knit Scarf/i });
    expect(scarf).toBeEnabled();

    const beanie = screen.getByRole('button', { name: /Slouchy Beanie/i });
    expect(beanie).toBeEnabled();

    const bow = screen.getByRole('button', { name: /Silk Ribbon Bow/i });
    expect(bow).toBeEnabled();

    const headphones = screen.getByRole('button', { name: /Studio Headphones/i });
    expect(headphones).toBeEnabled();

    // No lock copy or lock icons in UI
    expect(screen.queryByText(/Unlock via bond/i)).not.toBeInTheDocument();
  });

  it('selects cat and outfit and saves changes to store', () => {
    render(<OutfitSheet open={true} onClose={onClose} />);

    // Select Chai
    const chaiBtn = screen.getByRole('button', { name: /Chai/i });
    fireEvent.click(chaiBtn);

    // Select Wire Glasses
    const glassesBtn = screen.getByRole('button', { name: /Wire Glasses/i });
    fireEvent.click(glassesBtn);

    // Click Save
    const saveBtn = screen.getByRole('button', { name: /Save changes/i });
    fireEvent.click(saveBtn);

    expect(useCatStore.getState().catId).toBe('chai');
    expect(useCatStore.getState().outfitId).toBe('glasses');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cancels changes when Cancel is clicked without modifying store', () => {
    render(<OutfitSheet open={true} onClose={onClose} />);

    // Select Chai
    const chaiBtn = screen.getByRole('button', { name: /Chai/i });
    fireEvent.click(chaiBtn);

    // Click Cancel
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(useCatStore.getState().catId).toBe('mochi');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
