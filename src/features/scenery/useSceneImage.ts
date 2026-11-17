import { useState, useEffect } from 'react';
import type { SceneId } from './types';
import { getSceneById } from '@/data/scenes';

export type ImageStatus = 'loading' | 'loaded' | 'error';

// In-memory cache of loaded image URLs to prevent re-fetching and flicker
const loadedImageUrls = new Set<string>();

/**
 * Determines whether to serve the `sm` or `md` asset variant
 * based on viewport width and device pixel ratio.
 */
export function getAppropriateSceneSrc(sceneId: SceneId): string {
  const scene = getSceneById(sceneId);
  if (typeof window === 'undefined') {
    return scene.sources.md;
  }
  const dpr = window.devicePixelRatio || 1;
  const effectiveWidth = window.innerWidth * dpr;
  return effectiveWidth <= 960 ? scene.sources.sm : scene.sources.md;
}

/**
 * Preload a scene image asset into the browser cache (e.g. on thumbnail hover/focus).
 */
export function preloadSceneImage(sceneId: SceneId): Promise<void> {
  const scene = getSceneById(sceneId);
  const src = scene.sources.md; // preload md variant so high-res is ready

  if (loadedImageUrls.has(src)) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loadedImageUrls.add(src);
      resolve();
    };
    img.onerror = () => {
      resolve(); // resolve so callers don't reject unexpectedly
    };
  });
}

/**
 * Hook to select appropriate scene image source, preload, and track load status.
 */
export function useSceneImage(sceneId: SceneId): {
  src: string;
  status: ImageStatus;
} {
  const src = getAppropriateSceneSrc(sceneId);
  const [status, setStatus] = useState<ImageStatus>(() =>
    loadedImageUrls.has(src) ? 'loaded' : 'loading',
  );

  useEffect(() => {
    if (loadedImageUrls.has(src)) {
      setStatus('loaded');
      return;
    }

    setStatus('loading');
    let cancelled = false;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      loadedImageUrls.add(src);
      if (!cancelled) {
        setStatus('loaded');
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        setStatus('error');
      }
    };

    return () => {
      cancelled = true;
    };
  }, [src]);

  return { src, status };
}
