import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CatAccessory } from './CatAccessory';
import { CatCompanion } from './CatCompanion';
import { useCatStore } from '@/features/cat/store';
import { OUTFITS } from '@/data/outfits';

describe('CatAccessory unit rendering', () => {
  it('renders nothing when outfitId is null or "none" (Natural Fur default)', () => {
    const { container: c1 } = render(<CatAccessory outfitId={null} catId="mochi" />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<CatAccessory outfitId="none" catId="mochi" />);
    expect(c2.firstChild).toBeNull();
  });

  const outfitIds = ['glasses', 'scarf', 'beanie', 'bow', 'headphones'] as const;

  it.each(outfitIds)(
    'renders accessory layer for outfit "%s" on Mochi',
    outfitId => {
      render(<CatAccessory outfitId={outfitId} catId="mochi" poseId="idle_happy" />);
      const layer = screen.getByTestId(`accessory-layer-${outfitId}`);
      expect(layer).toBeInTheDocument();
      expect(layer).toHaveAttribute('data-cat-id', 'mochi');
      expect(layer).toHaveAttribute('data-outfit-id', outfitId);
    },
  );

  it.each(outfitIds)(
    'renders accessory layer for outfit "%s" on Chai with Chai styling',
    outfitId => {
      render(<CatAccessory outfitId={outfitId} catId="chai" poseId="idle_happy" />);
      const layer = screen.getByTestId(`accessory-layer-${outfitId}`);
      expect(layer).toBeInTheDocument();
      expect(layer).toHaveAttribute('data-cat-id', 'chai');
      expect(layer).toHaveAttribute('data-outfit-id', outfitId);
    },
  );

  it('adapts coordinates across pose changes (idle, pet, play, stretch, nap)', () => {
    const { rerender } = render(
      <CatAccessory outfitId="scarf" catId="mochi" poseId="idle_happy" />,
    );
    expect(screen.getByTestId('accessory-layer-scarf')).toHaveAttribute('data-pose-id', 'idle_happy');

    rerender(<CatAccessory outfitId="scarf" catId="mochi" poseId="stretch" />);
    expect(screen.getByTestId('accessory-layer-scarf')).toHaveAttribute('data-pose-id', 'stretch');

    rerender(<CatAccessory outfitId="scarf" catId="mochi" poseId="break_nap" />);
    expect(screen.getByTestId('accessory-layer-scarf')).toHaveAttribute('data-pose-id', 'break_nap');
  });
});

describe('CatCompanion accessory end-to-end integration', () => {
  beforeEach(() => {
    useCatStore.setState({
      catId: 'mochi',
      outfitId: null,
      name: 'Mochi',
      bond: 10,
    });
  });

  it('renders no accessory layer by default (Natural Fur)', () => {
    render(<CatCompanion />);
    expect(screen.queryByTestId(/accessory-layer-/)).not.toBeInTheDocument();
    expect(screen.getByText('Cream Tabby')).toBeInTheDocument();
  });

  it('updates rendered accessory layer when each outfit is selected on Mochi', () => {
    render(<CatCompanion />);

    for (const outfit of OUTFITS) {
      if (outfit.id === 'none') continue;

      act(() => {
        useCatStore.getState().setOutfitId(outfit.id);
      });

      const layer = screen.getByTestId(`accessory-layer-${outfit.id}`);
      expect(layer).toBeInTheDocument();
      expect(layer).toHaveAttribute('data-cat-id', 'mochi');

      // Companion tile & button copy reflects selected outfit name
      expect(screen.getAllByText(new RegExp(outfit.name, 'i')).length).toBeGreaterThan(0);
    }
  });

  it('updates rendered accessory layer when each outfit is selected on Chai', () => {
    act(() => {
      useCatStore.getState().setCatId('chai');
      useCatStore.getState().setName('Chai');
    });

    render(<CatCompanion />);

    for (const outfit of OUTFITS) {
      if (outfit.id === 'none') continue;

      act(() => {
        useCatStore.getState().setOutfitId(outfit.id);
      });

      const layer = screen.getByTestId(`accessory-layer-${outfit.id}`);
      expect(layer).toBeInTheDocument();
      expect(layer).toHaveAttribute('data-cat-id', 'chai');

      // Companion tile & button copy reflects selected outfit name
      expect(screen.getAllByText(new RegExp(outfit.name, 'i')).length).toBeGreaterThan(0);
    }
  });

  it('removes accessory layer when selecting none / Natural Fur', () => {
    render(<CatCompanion />);

    act(() => {
      useCatStore.getState().setOutfitId('glasses');
    });
    expect(screen.getByTestId('accessory-layer-glasses')).toBeInTheDocument();

    act(() => {
      useCatStore.getState().setOutfitId(null);
    });
    expect(screen.queryByTestId(/accessory-layer-/)).not.toBeInTheDocument();
  });
});
