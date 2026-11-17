import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('Audio Autoplay Gate', () => {
  let contextConstructorSpy: ReturnType<typeof vi.fn>;
  let mockDestination: Record<string, unknown>;

  beforeEach(() => {
    vi.resetModules();

    mockDestination = {};
    const mockCtxInstance = {
      state: 'suspended',
      currentTime: 0,
      destination: mockDestination,
      resume: vi.fn().mockResolvedValue(undefined),
      createGain: vi.fn().mockReturnValue({
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          cancelScheduledValues: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
      createOscillator: vi.fn().mockReturnValue({
        type: 'sine',
        frequency: {
          setValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
    };

    contextConstructorSpy = vi.fn().mockImplementation(() => mockCtxInstance);
    // Assign to window
    (window as unknown as { AudioContext: unknown }).AudioContext = contextConstructorSpy;
  });

  afterEach(() => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
  });

  it('does NOT instantiate AudioContext merely by importing audio modules', async () => {
    // Dynamically import audio modules
    const chimeModule = await import('./chime');
    const sfxModule = await import('./sfx');
    const ambientModule = await import('./ambient');

    expect(chimeModule).toBeDefined();
    expect(sfxModule).toBeDefined();
    expect(ambientModule).toBeDefined();

    // Context constructor must NOT have been called
    expect(contextConstructorSpy).not.toHaveBeenCalled();
  });

  it('instantiates AudioContext ONLY when explicit user interaction triggers primeAudioContext', async () => {
    const { primeAudioContext } = await import('./chime');

    expect(contextConstructorSpy).not.toHaveBeenCalled();

    // User gesture / click triggers priming
    primeAudioContext();

    expect(contextConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it('playChime triggers audio synthesis on user request', async () => {
    const { playChime } = await import('./chime');

    expect(contextConstructorSpy).not.toHaveBeenCalled();

    playChime();

    expect(contextConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it('ambientEngine does NOT construct AudioContext until user starts ambient sound', async () => {
    const { ambientEngine } = await import('./ambient');

    expect(contextConstructorSpy).not.toHaveBeenCalled();
    expect(ambientEngine.getAudioContext()).toBeNull();

    // Explicit user start
    ambientEngine.startEngine();

    expect(contextConstructorSpy).toHaveBeenCalledTimes(1);
    expect(ambientEngine.getAudioContext()).not.toBeNull();

    ambientEngine.dispose();
  });
});
