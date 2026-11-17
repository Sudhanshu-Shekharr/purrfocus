import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileLayerSource } from './fileLayer';

// Mock Howler's Howl
const mockHowlInstance = {
  play: vi.fn(),
  stop: vi.fn(),
  fade: vi.fn(),
  volume: vi.fn(),
  unload: vi.fn(),
};

vi.mock('howler', () => {
  return {
    Howl: vi.fn().mockImplementation(() => mockHowlInstance),
  };
});

describe('FileLayerSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with metadata and identifies object URLs correctly', () => {
    const regularSource = new FileLayerSource('custom-1', 'https://example.com/sound.mp3', 'Study Beats');
    expect(regularSource.id).toBe('custom-1');
    expect(regularSource.displayName).toBe('Study Beats');
    expect(regularSource.isObjectUrl).toBe(false);

    const blobSource = new FileLayerSource('custom-2', 'blob:http://localhost/123-abc', 'My Upload');
    expect(blobSource.isObjectUrl).toBe(true);
  });

  it('starts playback and sets volume on start and setGain', () => {
    const source = new FileLayerSource('custom-1', 'https://example.com/sound.mp3');
    const ctx = {} as AudioContext;
    const dest = {} as AudioNode;

    source.start(ctx, dest);
    expect(mockHowlInstance.play).toHaveBeenCalledTimes(1);
    expect(source.isConnected()).toBe(true);

    source.setGain(0.7, 0.8);
    expect(mockHowlInstance.fade).toHaveBeenCalledWith(0, 0.7, 800);

    source.stop();
    expect(mockHowlInstance.stop).toHaveBeenCalledTimes(1);
    expect(source.isConnected()).toBe(false);
  });

  it('revokes object URLs on dispose if isObjectUrl is true', () => {
    const revokeSpy = vi.fn();
    const originalRevoke = URL.revokeObjectURL;
    URL.revokeObjectURL = revokeSpy;

    try {
      const blobUrl = 'blob:http://localhost/test-uuid';
      const source = new FileLayerSource('custom-upload', blobUrl, 'User Upload.mp3');
      source.start({} as AudioContext, {} as AudioNode);

      source.dispose();
      expect(revokeSpy).toHaveBeenCalledWith(blobUrl);
      expect(mockHowlInstance.unload).toHaveBeenCalledTimes(1);
    } finally {
      URL.revokeObjectURL = originalRevoke;
    }
  });
});
