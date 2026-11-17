import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { SceneryCard } from './SceneryCard';
import { useSceneryStore } from '@/features/scenery/store';
import { ToastProvider } from '@/components/ui/Toast';
import { SCENES } from '@/data/scenes';

const renderSceneryCard = () => {
  return render(
    <ToastProvider>
      <SceneryCard />
    </ToastProvider>,
  );
};

describe('SceneryCard', () => {
  beforeEach(() => {
    useSceneryStore.setState({
      activeSceneId: 'scene4', // default: Sunset Cabin
      favoriteSceneIds: [],
    });
    localStorage.clear();
  });

  it('renders card title, active scene name, and initial 3 rotating thumbnails', () => {
    renderSceneryCard();
    expect(screen.getByText('Somewhere lovely')).toBeInTheDocument();
    expect(screen.getAllByText('Sunset Cabin').length).toBeGreaterThanOrEqual(1);

    // With active scene4 (index 0 in SCENES), visible thumbnails are scene4, scene5, scene1
    expect(screen.getByLabelText(/switch scene to sunset cabin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/switch scene to sunlit studio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/switch scene to rainy highrise/i)).toBeInTheDocument();
  });

  it('rotates visible thumbnails when active scene changes', () => {
    renderSceneryCard();

    // Click on Sunlit Studio (scene5)
    const sunlitThumb = screen.getByLabelText(/switch scene to sunlit studio/i);
    fireEvent.click(sunlitThumb);

    expect(useSceneryStore.getState().activeSceneId).toBe('scene5');

    // With active scene5 (index 1), visible thumbnails rotate to scene5, scene1, scene2
    expect(screen.getByLabelText(/switch scene to sunlit studio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/switch scene to rainy highrise/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/switch scene to midnight nook/i)).toBeInTheDocument();
  });

  it('wraps around the ring at the end of the catalog', () => {
    useSceneryStore.setState({ activeSceneId: 'scene3' }); // Late Reading (index 4)
    renderSceneryCard();

    // Visible thumbnails rotate with wrap-around: scene3, scene4, scene5
    expect(screen.getByLabelText(/switch scene to late reading/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/switch scene to sunset cabin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/switch scene to sunlit studio/i)).toBeInTheDocument();
  });

  it('toggles favorite on the active scene', () => {
    renderSceneryCard();
    const favButton = screen.getByRole('button', { name: /save this space/i });
    expect(favButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(favButton);
    expect(useSceneryStore.getState().favoriteSceneIds).toContain('scene4');
    expect(screen.getByRole('button', { name: /saved to favorites/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /saved to favorites/i }));
    expect(useSceneryStore.getState().favoriteSceneIds).not.toContain('scene4');
  });

  it('navigates thumbnails with keyboard arrow keys', () => {
    renderSceneryCard();
    const thumbs = screen.getAllByRole('button', { name: /switch scene to/i });
    expect(thumbs).toHaveLength(3);

    thumbs[0]?.focus();
    expect(document.activeElement).toBe(thumbs[0]);

    fireEvent.keyDown(thumbs[0]!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(thumbs[1]);

    fireEvent.keyDown(thumbs[1]!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(thumbs[2]);

    fireEvent.keyDown(thumbs[2]!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(thumbs[1]);
  });

  it('opens scenery gallery modal and lists all 5 scenes', () => {
    renderSceneryCard();
    const changeSceneryBtn = screen.getByRole('button', { name: /change scenery ↗/i });
    fireEvent.click(changeSceneryBtn);

    // Modal opens
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Scenery Gallery')).toBeInTheDocument();

    // Lists all 5 scenes in modal
    for (const scene of SCENES) {
      expect(screen.getByRole('heading', { name: scene.name, level: 3 })).toBeInTheDocument();
    }
  });
});
