export type EmbedProvider = 'youtube' | 'spotify' | 'soundcloud';

export interface EmbedInfo {
  provider: EmbedProvider;
  embedUrl: string;
  originalUrl: string;
  title: string;
}

export interface ParseEmbedResult {
  valid: boolean;
  info?: EmbedInfo;
  error?: string;
}

const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const SPOTIFY_ID_REGEX = /^[a-zA-Z0-9]{16,40}$/;
const SPOTIFY_TYPES = new Set(['track', 'album', 'playlist', 'artist', 'episode']);

/**
 * Pure URL parser validating and converting YouTube, Spotify, and SoundCloud links
 * into their respective official sandboxed embed URLs.
 * Rejects invalid protocols, lookalike hostnames, and unsupported providers.
 */
export function parseEmbedUrl(input: string): ParseEmbedResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a URL.' };
  }

  let parsed: URL;
  try {
    // Prefix https:// if user pasted without protocol e.g. youtube.com/watch?v=...
    const urlString = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsed = new URL(urlString);
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS links are allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 1. YouTube
  // Allowed hosts: youtube.com, www.youtube.com, m.youtube.com, music.youtube.com, youtu.be
  const isYouTubeHost =
    hostname === 'youtu.be' ||
    hostname === 'youtube.com' ||
    hostname === 'www.youtube.com' ||
    hostname === 'm.youtube.com' ||
    hostname === 'music.youtube.com';

  if (isYouTubeHost) {
    let videoId: string | null = null;

    if (hostname === 'youtu.be') {
      // Pathname is /VIDEO_ID
      const id = parsed.pathname.slice(1).split('/')[0];
      if (id && YOUTUBE_VIDEO_ID_REGEX.test(id)) {
        videoId = id;
      }
    } else {
      // /watch?v=VIDEO_ID or /embed/VIDEO_ID or /v/VIDEO_ID
      if (parsed.searchParams.has('v')) {
        const id = parsed.searchParams.get('v');
        if (id && YOUTUBE_VIDEO_ID_REGEX.test(id)) {
          videoId = id;
        }
      } else {
        const match = parsed.pathname.match(/^\/(?:embed|v|shorts)\/([a-zA-Z0-9_-]{11})/);
        if (match && match[1]) {
          videoId = match[1];
        }
      }
    }

    if (!videoId) {
      return { valid: false, error: 'Could not find a valid YouTube video ID.' };
    }

    return {
      valid: true,
      info: {
        provider: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        originalUrl: trimmed,
        title: 'YouTube Player',
      },
    };
  }

  // 2. Spotify
  // Allowed hosts: open.spotify.com, spotify.com
  const isSpotifyHost = hostname === 'open.spotify.com' || hostname === 'spotify.com';

  if (isSpotifyHost) {
    // /track/ID, /album/ID, /playlist/ID, /artist/ID, /episode/ID
    // or /embed/track/ID etc.
    const segments = parsed.pathname.split('/').filter(Boolean);
    let typeIndex = -1;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg && SPOTIFY_TYPES.has(seg)) {
        typeIndex = i;
        break;
      }
    }

    if (typeIndex !== -1) {
      const type = segments[typeIndex];
      const nextSeg = segments[typeIndex + 1];
      const id = nextSeg ? nextSeg.split('?')[0] : '';

      if (type && id && SPOTIFY_ID_REGEX.test(id)) {
        return {
          valid: true,
          info: {
            provider: 'spotify',
            embedUrl: `https://open.spotify.com/embed/${type}/${id}`,
            originalUrl: trimmed,
            title: `Spotify ${type.charAt(0).toUpperCase() + type.slice(1)} Player`,
          },
        };
      }
    }

    return { valid: false, error: 'Could not find a valid Spotify track or playlist.' };
  }

  // 3. SoundCloud
  // Allowed hosts: soundcloud.com, m.soundcloud.com, on.soundcloud.com
  const isSoundCloudHost =
    hostname === 'soundcloud.com' ||
    hostname === 'm.soundcloud.com' ||
    hostname === 'on.soundcloud.com' ||
    hostname === 'w.soundcloud.com';

  if (isSoundCloudHost) {
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length < 1) {
      return { valid: false, error: 'Please enter a link to a SoundCloud track or playlist.' };
    }

    // Clean URL without dangerous parameters
    const cleanUrl = `https://soundcloud.com/${segments.join('/')}`;
    const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      cleanUrl,
    )}&color=%23c4785b&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;

    return {
      valid: true,
      info: {
        provider: 'soundcloud',
        embedUrl,
        originalUrl: trimmed,
        title: 'SoundCloud Player',
      },
    };
  }

  return {
    valid: false,
    error: 'Only YouTube, Spotify, and SoundCloud links are supported.',
  };
}
