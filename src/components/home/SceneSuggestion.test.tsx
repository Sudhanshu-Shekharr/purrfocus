import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { SceneryCard } from './SceneryCard';
import { useSceneryStore } from '@/features/scenery/store';
import { ToastProvider } from '@/components/ui/Toast';

const renderSceneryCard = (timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'lateNight') => {
  return render(
    <ToastProvider>
      <SceneryCard currentTimeOfDay={timeOfDay} />
    </ToastProvider>,
  );
};

describe('SceneryCard - Scene Suggestion Chip', () => {
  beforeEach(() => {
    useSceneryStore.setState({
      activeSceneId: 'scene4', // evening (Sunset Cabin)
      favoriteSceneIds: [],
    });
    localStorage.clear();
  });

  it('does not display suggestion chip when current time of day matches active scene', () => {
    // scene4 is evening, current time is evening
    renderSceneryCard('evening');
    expect(screen.queryByTestId('scene-suggestion-chip')).not.toBeInTheDocument();
  });

  it('displays suggestion chip when time of day mismatches and matching scene exists', () => {
    // scene4 is evening, current time is morning -> scene5 is morning
    renderSceneryCard('morning');
    const chip = screen.getByTestId('scene-suggestion-chip');
    expect(chip).toBeInTheDocument();
    expect(screen.getByText('Morning light suits this hour · Try it')).toBeInTheDocument();
    expect(screen.getByText('(soft-piano)')).toBeInTheDocument();
  });

  it('applies suggested scene when clicked', () => {
    // active is scene4 (evening), current is morning -> suggestion is scene5 (Sunlit Studio)
    renderSceneryCard('morning');
    const suggestionBtn = screen.getByRole('button', { name: /switch to suggested scene: sunlit studio/i });
    fireEvent.click(suggestionBtn);

    expect(useSceneryStore.getState().activeSceneId).toBe('scene5');
    // Now activeScene is scene5 (morning), which matches morning -> chip disappears
    expect(screen.queryByTestId('scene-suggestion-chip')).not.toBeInTheDocument();
  });

  it('dismisses suggestion chip when dismiss button is clicked', () => {
    const { rerender } = renderSceneryCard('morning');
    expect(screen.getByTestId('scene-suggestion-chip')).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: /dismiss scene suggestion/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByTestId('scene-suggestion-chip')).not.toBeInTheDocument();

    // Rerender with morning - still dismissed
    rerender(
      <ToastProvider>
        <SceneryCard currentTimeOfDay="morning" />
      </ToastProvider>,
    );
    expect(screen.queryByTestId('scene-suggestion-chip')).not.toBeInTheDocument();

    // But if time changes to afternoon (mismatching scene4), chip appears for afternoon
    rerender(
      <ToastProvider>
        <SceneryCard currentTimeOfDay="afternoon" />
      </ToastProvider>,
    );
    expect(screen.getByTestId('scene-suggestion-chip')).toBeInTheDocument();
    expect(screen.getByText('Afternoon light suits this hour · Try it')).toBeInTheDocument();
  });
});
