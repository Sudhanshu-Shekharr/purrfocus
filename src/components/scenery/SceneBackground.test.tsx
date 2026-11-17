import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SceneBackground } from './SceneBackground';
import { useSceneryStore } from '@/features/scenery/store';
import { getSceneById, DEFAULT_SCENE_ID } from '@/data/scenes';

describe('SceneBackground', () => {
  beforeEach(() => {
    useSceneryStore.setState({
      activeSceneId: DEFAULT_SCENE_ID,
      favoriteSceneIds: [],
    });
    document.documentElement.setAttribute('data-scene', 'peach');
  });

  it('renders with testid and aria-hidden true', () => {
    render(<SceneBackground />);
    const bg = screen.getByTestId('scene-background');
    expect(bg).toBeInTheDocument();
    expect(bg).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders initial scene layer with fallback gradient', () => {
    render(<SceneBackground />);
    const defaultScene = getSceneById(DEFAULT_SCENE_ID);
    const layer = document.querySelector(`[data-layer-scene="${DEFAULT_SCENE_ID}"]`);
    expect(layer).toBeInTheDocument();
    expect((layer as HTMLElement).style.background).toContain('linear-gradient');
    expect(document.documentElement.getAttribute('data-scene')).toBe(defaultScene.tokenSet);
  });

  it('updates scene layer and data-scene when active scene changes', () => {
    vi.useFakeTimers();
    render(<SceneBackground />);

    act(() => {
      useSceneryStore.getState().setScene('scene1');
    });

    expect(document.documentElement.getAttribute('data-scene')).toBe('rain');

    // Both current layer and outgoing layer should be present during crossfade
    const outgoing = document.querySelector(`[data-layer-scene="${DEFAULT_SCENE_ID}"]`);
    const current = document.querySelector('[data-layer-scene="scene1"]');
    expect(outgoing).toBeInTheDocument();
    expect(current).toBeInTheDocument();

    // After 800ms crossfade duration, outgoing layer is removed
    act(() => {
      vi.advanceTimersByTime(850);
    });

    expect(document.querySelector(`[data-layer-scene="${DEFAULT_SCENE_ID}"]`)).toBeNull();
    expect(document.querySelector('[data-layer-scene="scene1"]')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
