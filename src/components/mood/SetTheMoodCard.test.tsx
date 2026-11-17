import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetTheMoodCard } from './SetTheMoodCard';
import { useAmbientStore } from '@/features/audio/ambient/store';
import { useSceneryStore } from '@/features/scenery/store';
import * as chime from '@/features/audio/chime';

describe('SetTheMoodCard', () => {
  beforeEach(() => {
    localStorage.clear();
    useAmbientStore.getState().resetMix();
    useAmbientStore.setState({ sessionStarted: false, muted: false, master: 0.7 });
    useSceneryStore.setState({ activeSceneId: 'scene1' }); // scene1 ambientSuggestion is 'rainfall'
  });

  it('renders title, status chip, and preset tiles', () => {
    render(<SetTheMoodCard />);
    expect(screen.getByText('SET THE MOOD')).toBeInTheDocument();
    expect(screen.getByText('Sound & Mood')).toBeInTheDocument();
    expect(screen.getByText('SOUND OFF')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Soft piano' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rainfall' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Brown noise' })).toBeInTheDocument();
  });

  it('clicking a tile sets level to 0.6 and primes audio', async () => {
    const user = userEvent.setup();
    const primeSpy = vi.spyOn(chime, 'primeAudioContext').mockImplementation(() => {});

    render(<SetTheMoodCard />);
    const pianoTile = screen.getByRole('button', { name: 'Soft piano' });

    expect(useAmbientStore.getState().levels['soft-piano']).toBe(0);
    expect(pianoTile).toHaveAttribute('aria-pressed', 'false');

    await user.click(pianoTile);

    expect(primeSpy).toHaveBeenCalled();
    expect(useAmbientStore.getState().levels['soft-piano']).toBe(0.6);
    expect(useAmbientStore.getState().sessionStarted).toBe(true);
    expect(pianoTile).toHaveAttribute('aria-pressed', 'true');

    // Click again to turn off
    await user.click(pianoTile);
    expect(useAmbientStore.getState().levels['soft-piano']).toBe(0);
    expect(pianoTile).toHaveAttribute('aria-pressed', 'false');

    primeSpy.mockRestore();
  });

  it('status chip primes audio on first click and toggles playback', async () => {
    const user = userEvent.setup();
    const primeSpy = vi.spyOn(chime, 'primeAudioContext').mockImplementation(() => {});

    render(<SetTheMoodCard />);
    const statusChip = screen.getByText('SOUND OFF');

    await user.click(statusChip);

    expect(primeSpy).toHaveBeenCalled();
    expect(useAmbientStore.getState().sessionStarted).toBe(true);
    expect(screen.getByText('SOUND ON')).toBeInTheDocument();

    primeSpy.mockRestore();
  });

  it('scene suggestion chip sets level to 0.6 but NEVER starts playback by itself', async () => {
    const user = userEvent.setup();
    // Scene 1 suggests rainfall
    useSceneryStore.setState({ activeSceneId: 'scene1' });
    useAmbientStore.setState({ sessionStarted: false, levels: { rainfall: 0 } });

    render(<SetTheMoodCard />);
    const suggestionChip = screen.getByTestId('scene-ambient-suggestion');
    expect(suggestionChip).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /Rainfall suits this scene · Add to mix/i });
    await user.click(addBtn);

    // Rainfall level is now 0.6
    expect(useAmbientStore.getState().levels.rainfall).toBe(0.6);
    // CRITICAL: sessionStarted MUST remain false (never auto-plays!)
    expect(useAmbientStore.getState().sessionStarted).toBe(false);
  });

  it('dismissing scene suggestion hides it for the active scene', async () => {
    const user = userEvent.setup();
    useSceneryStore.setState({ activeSceneId: 'scene1' });
    render(<SetTheMoodCard />);

    const dismissBtn = screen.getByRole('button', { name: 'Dismiss ambient suggestion' });
    await user.click(dismissBtn);

    expect(screen.queryByTestId('scene-ambient-suggestion')).not.toBeInTheDocument();
  });

  it('supports roving tabindex keyboard navigation among tiles', async () => {
    const user = userEvent.setup();
    render(<SetTheMoodCard />);

    const pianoTile = screen.getByRole('button', { name: 'Soft piano' });
    const rainTile = screen.getByRole('button', { name: 'Rainfall' });
    const brownTile = screen.getByRole('button', { name: 'Brown noise' });

    expect(pianoTile).toHaveAttribute('tabIndex', '0');
    expect(rainTile).toHaveAttribute('tabIndex', '-1');
    expect(brownTile).toHaveAttribute('tabIndex', '-1');

    pianoTile.focus();
    await user.keyboard('{ArrowRight}');

    expect(document.activeElement).toBe(rainTile);
    expect(rainTile).toHaveAttribute('tabIndex', '0');
    expect(pianoTile).toHaveAttribute('tabIndex', '-1');

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(brownTile);

    // Wraps around to start
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(pianoTile);

    // Wraps backwards
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(brownTile);
  });

  it('expands and collapses Mix Layers panel', async () => {
    const user = userEvent.setup();
    render(<SetTheMoodCard />);

    const mixBtn = screen.getByRole('button', { name: /Mix layers ↗/i });
    expect(screen.queryByTestId('mix-layers-panel')).not.toBeInTheDocument();

    await user.click(mixBtn);
    expect(screen.getByTestId('mix-layers-panel')).toBeInTheDocument();

    await user.click(mixBtn);
    expect(screen.queryByTestId('mix-layers-panel')).not.toBeInTheDocument();
  });

  it('clicking a sound switches between sounds, resumes context, and sets master gain > 0', async () => {
    const user = userEvent.setup();
    const mockContext = {
      state: 'suspended',
      currentTime: 10.0,
      sampleRate: 44100,
      destination: { id: 'dest' },
      resume: vi.fn().mockResolvedValue(undefined),
      createGain: () => ({
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          cancelScheduledValues: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
      createOscillator: () => ({
        frequency: {
          value: 440,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        type: 'sine',
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createDelay: () => ({
        delayTime: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
      createBuffer: (_c: number, length: number) => ({
        length,
        sampleRate: 44100,
        getChannelData: () => new Float32Array(length),
      }),
      createBufferSource: () => ({
        buffer: null,
        loop: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createBiquadFilter: () => ({
        frequency: { setValueAtTime: vi.fn() },
        Q: { setValueAtTime: vi.fn() },
        type: 'bandpass',
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
    } as unknown as AudioContext;

    vi.spyOn(chime, 'getOrCreateAudioContext').mockReturnValue(mockContext);

    // Initial state: master is 0 (test case: cold start with 0 volume)
    useAmbientStore.setState({ master: 0, sessionStarted: false, levels: { 'soft-piano': 0, rainfall: 0 } });

    render(<SetTheMoodCard />);
    const pianoTile = screen.getByRole('button', { name: 'Soft piano' });
    const rainTile = screen.getByRole('button', { name: 'Rainfall' });

    // 1. Click Soft piano
    await user.click(pianoTile);

    // Resumes context
    expect(mockContext.resume).toHaveBeenCalled();
    // Sets store state
    expect(useAmbientStore.getState().levels['soft-piano']).toBe(0.6);
    expect(useAmbientStore.getState().levels.rainfall).toBe(0);
    // Master gain is lifted > 0 (defaults to 0.7)
    expect(useAmbientStore.getState().master).toBe(0.7);
    expect(useAmbientStore.getState().sessionStarted).toBe(true);

    // 2. Click Rainfall -> switches to Rainfall (soft-piano becomes 0, rainfall becomes 0.6)
    await user.click(rainTile);
    expect(useAmbientStore.getState().levels['soft-piano']).toBe(0);
    expect(useAmbientStore.getState().levels.rainfall).toBe(0.6);

    // 3. Click Rainfall again -> toggles off (rainfall becomes 0)
    await user.click(rainTile);
    expect(useAmbientStore.getState().levels.rainfall).toBe(0);
  });
});
