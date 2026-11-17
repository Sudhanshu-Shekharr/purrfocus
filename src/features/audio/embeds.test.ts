import { describe, it, expect } from 'vitest';
import { parseEmbedUrl } from './embeds';

describe('parseEmbedUrl', () => {
  describe('YouTube', () => {
    it('parses standard youtube.com/watch links', () => {
      const res = parseEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(res.valid).toBe(true);
      expect(res.info?.provider).toBe('youtube');
      expect(res.info?.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('parses youtu.be short links', () => {
      const res = parseEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
      expect(res.valid).toBe(true);
      expect(res.info?.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('parses youtube.com/shorts links', () => {
      const res = parseEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ');
      expect(res.valid).toBe(true);
      expect(res.info?.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('parses music.youtube.com links', () => {
      const res = parseEmbedUrl('https://music.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(res.valid).toBe(true);
      expect(res.info?.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('parses links without protocol (auto prepends https://)', () => {
      const res = parseEmbedUrl('youtube.com/watch?v=dQw4w9WgXcQ');
      expect(res.valid).toBe(true);
      expect(res.info?.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('parses links with extra query parameters', () => {
      const res = parseEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&feature=shared');
      expect(res.valid).toBe(true);
      expect(res.info?.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('rejects youtube URLs without a valid video id', () => {
      const res = parseEmbedUrl('https://www.youtube.com/watch');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Could not find a valid YouTube video ID.');
    });
  });

  describe('Spotify', () => {
    it('parses Spotify track links', () => {
      const res = parseEmbedUrl('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');
      expect(res.valid).toBe(true);
      expect(res.info?.provider).toBe('spotify');
      expect(res.info?.embedUrl).toBe('https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT');
    });

    it('parses Spotify playlist links with query parameters', () => {
      const res = parseEmbedUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=123');
      expect(res.valid).toBe(true);
      expect(res.info?.embedUrl).toBe('https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M');
    });

    it('parses Spotify album links', () => {
      const res = parseEmbedUrl('https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3');
      expect(res.valid).toBe(true);
      expect(res.info?.embedUrl).toBe('https://open.spotify.com/embed/album/1DFixLWuPkv3KT3TnV35m3');
    });

    it('rejects Spotify URLs missing an ID', () => {
      const res = parseEmbedUrl('https://open.spotify.com/track/');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Could not find a valid Spotify track or playlist.');
    });
  });

  describe('SoundCloud', () => {
    it('parses soundcloud track links', () => {
      const res = parseEmbedUrl('https://soundcloud.com/artist-name/track-title');
      expect(res.valid).toBe(true);
      expect(res.info?.provider).toBe('soundcloud');
      expect(res.info?.embedUrl).toContain('https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fartist-name%2Ftrack-title');
    });

    it('parses mobile soundcloud links', () => {
      const res = parseEmbedUrl('https://m.soundcloud.com/artist/track');
      expect(res.valid).toBe(true);
      expect(res.info?.embedUrl).toContain('https://w.soundcloud.com/player/?url=');
    });
  });

  describe('Security & Validation', () => {
    it('rejects lookalike/phishing domains for YouTube', () => {
      const res = parseEmbedUrl('https://youtube.com.attacker.com/watch?v=dQw4w9WgXcQ');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Only YouTube, Spotify, and SoundCloud links are supported.');
    });

    it('rejects lookalike domains for Spotify', () => {
      const res = parseEmbedUrl('https://evil-spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Only YouTube, Spotify, and SoundCloud links are supported.');
    });

    it('rejects lookalike domains for SoundCloud', () => {
      const res = parseEmbedUrl('https://soundcloud.com.evil.org/track');
      expect(res.valid).toBe(false);
    });

    it('rejects dangerous protocols like javascript:', () => {
      const res = parseEmbedUrl('javascript:alert(1)');
      expect(res.valid).toBe(false);
    });

    it('rejects unsupported providers like Vimeo or Twitch', () => {
      const res = parseEmbedUrl('https://vimeo.com/123456');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Only YouTube, Spotify, and SoundCloud links are supported.');
    });

    it('rejects empty strings or whitespace', () => {
      const res = parseEmbedUrl('   ');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Please enter a URL.');
    });
  });
});
